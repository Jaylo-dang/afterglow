# Singapore Golden Hour & Sunset/Sunrise Photography Spot Finder

A web application designed for landscape and golden hour photographers in Singapore. It evaluates live and forecasted atmospheric conditions across five designated Singapore vantage points, calculates straight-line distances from the visitor's device, and integrates live public transit bus connections and arrivals via LTA DataMall, alongside NASA's Astronomy Picture of the Day (APOD).

---

## Local Development & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### Running Locally
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure the optional or required variables described below.

3. Start the local development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

4. Build for production:
   ```bash
   npm run build
   npm run preview
   ```

### Environment Variables
- `NASA_API_KEY`: *(Optional)* API key from NASA (`https://api.nasa.gov/`) for fetching the Astronomy Picture of the Day. If omitted or empty, the Astronomy Picture section cleanly reports that the key is unconfigured without breaking other sections.
- `LTA_ACCOUNT_KEY`: *(Optional)* API key from Land Transport Authority (LTA) DataMall for live bus stops and real-time arrival estimates. If omitted, the nearest spots endpoint seamlessly falls back to a built-in bus stops snapshot list (read from LTA DataMall on 24 September 2026) with an explicit notice, and the arrivals endpoint reports configuration status.
- `APP_URL`: *(Optional)* Base URL of the hosted application.

> **Note:** Never commit actual API keys or secrets to version control.

---

## API Routes Contract & Documentation

### 1. `api/sky.js` (Sky Atmospheric Conditions & Spot Ranking)

- **Purpose:** Fetches 7-day hourly cloud layers (low, mid, high) and horizontal visibility from Open-Meteo across five designated Singapore photography spots (`Marina Barrage`, `Henderson Waves`, `Siloso Beach, Sentosa`, `Bedok Jetty, East Coast Park`, and `Punggol Settlement`). Computes custom sunset/sunrise scores (0–100) and detects forecast grid collisions.
- **Query Parameters:**
  - `mode`: `'sunset'` (default) or `'sunrise'`
  - `date`: Optional date in `'YYYY-MM-DD'` format
- **Success (HTTP 200):**
  Returns a JSON object containing:
  - `fetchedAt`: ISO 8601 timestamp of when the forecast was retrieved from Open-Meteo.
  - `source`: `"Open-Meteo"`.
  - `mode`: `'sunset'` or `'sunrise'`.
  - `outOfRange`: `false`.
  - `date`: Selected forecast date (`YYYY-MM-DD`).
  - `availableDates`: Array of dates available within Open-Meteo's 7-day forecast window.
  - `eventTime`: Exact sunset or sunrise moment for Singapore.
  - `rankedSpots`: Spots filtered by facing direction (west for sunset, east for sunrise) sorted descending by condition score.
  - `allSpots`: Complete array of all five evaluated spots with raw metrics (`cloud_cover_low`, `cloud_cover_mid`, `cloud_cover_high`, `visibility_km`), requested GPS coordinates, grid coordinates (`gridLat`, `gridLon`), and grid collision flags (`sharesGridPoint`, `sharedWithSpots`).
  - `sharedGridSpots`: Array of spot names that resolve to the same Open-Meteo forecast grid square (e.g. Henderson Waves and Siloso Beach share the same grid point).
  - `sharedGridDescriptions`: Human-readable explanations of shared grid squares.
  - `missingSpots`: Array of spot names omitted if upstream omitted any spot index.
- **Failures & Out-of-Range Handling:**
  - *Edge Date Validation Failure (Malformed Date)*: HTTP 400 with reference `'SKY-DATE-400'` and message specifying required `YYYY-MM-DD` format.
  - *Date Out of Range*: If a well-formed date is outside the 7-day window, returns HTTP 200 with `outOfRange: true`, `message: "The forecast does not cover the requested day, because the free tier only goes seven days ahead"`, and `availableDates`.
  - *Open-Meteo Down/Unreachable*: HTTP 502 with reference `'SKY-NET-502'` and message `"Open-Meteo could not be reached at all"`.
  - *Open-Meteo Refused Request (non-2xx)*: Preserves upstream HTTP status code with reference `'SKY-REF-{status}'` and descriptive error message.
  - *JSON Parsing Error*: HTTP 502 with reference `'SKY-PARSE-502'`.
- **Environment Variables:** None required (Open-Meteo free tier requires no API key).
- **Data Freshness & Caching:** `Cache-Control: s-maxage=1800, stale-while-revalidate=3600` (cached up to 30 minutes, served stale while revalidating for up to 1 hour).

---

### 2. `api/apod.js` (NASA Astronomy Picture of the Day)

- **Purpose:** Fetches NASA's Astronomy Picture of the Day (APOD) metadata, HD image URL, and video links. Formats photographer credit cleanly.
- **Success (HTTP 200):**
  Returns a JSON object containing:
  - `date`: Date of the APOD picture (`YYYY-MM-DD`).
  - `title`: Title of the picture.
  - `explanation`: Educational description written by an astronomer.
  - `url`: Direct URL to the picture or video embed.
  - `media_type`: `'image'` or `'video'`.
  - `credit`: Formatted attribution (e.g. `"Image: NASA"` when copyright is absent, or `"Image: " + photographer` with line breaks removed).
- **Failures & Refusal Handling:**
  - *Missing/Empty `NASA_API_KEY`*: HTTP 503 with reference `'NASA-KEY-503'` and message `"NASA_API_KEY environment variable is not configured or empty"`. Never attempts upstream fetch without key.
  - *NASA Unreachable*: HTTP 502 with reference `'NASA-NET-502'` and message `"NASA APOD upstream could not be reached at all"`.
  - *NASA Refused Request (non-2xx)*: Preserves upstream HTTP status code (e.g., 403, 429) with reference `'NASA-REF-{status}'`.
  - *JSON Parsing Error*: HTTP 502 with reference `'NASA-PARSE-502'`.
- **Environment Variables:** `NASA_API_KEY` (required for live upstream fetch).
- **Data Freshness & Caching:** `Cache-Control: s-maxage=3600, stale-while-revalidate=7200` (cached for 1 hour, stale-while-revalidate for 2 hours).

---

### 3. `api/health.js` (Upstream Connectivity & Configuration Health Check)

- **Purpose:** Probes connection status and credentials individually across all three product dependencies: Open-Meteo, NASA, and LTA DataMall. Outputs a comprehensive, human-readable report without exposing credentials. Never throws and never allows a failure in one service to hide or compromise the report of the others.
- **Success (HTTP 200):**
  Returns a JSON object containing:
  - `environmentVariables`: Object reporting individual boolean configuration flags for `NASA_API_KEY` and `LTA_ACCOUNT_KEY`.
  - `upstreams`: Status of each upstream reachable:
    - `openMeteo`: HTTP status code (e.g., `200`) or `'unreachable'`.
    - `nasa`: HTTP status code, `'key missing'` (if `NASA_API_KEY` is not set; does not call upstream), or `'unreachable'`.
    - `ltaDataMall`: HTTP status code from a lightweight live probe (single bus arrival query to `03369`), `'key missing'` (if `LTA_ACCOUNT_KEY` is not set; does not call upstream), or `'unreachable'`.
  - `timestamp`: ISO 8601 timestamp of the health probe.
- **Failures & Down Source Handling:**
  Each probe is isolated in its own independent `try/catch` block. Network failures report `'unreachable'`, missing keys report `'key missing'`, and HTTP errors preserve the upstream status. Never crashes or throws.
- **Environment Variables:** Checks `NASA_API_KEY` and `LTA_ACCOUNT_KEY`.
- **Data Freshness & Caching:** `Cache-Control: no-cache, no-store, must-revalidate` (never cached; strictly real-time).

---

### 4. `api/nearest.js` (Nearest Photography Spots & Bus Connections)

- **Purpose:** Evaluates distance from the visitor's coordinates (latitude and longitude) to the five Singapore photography spots, and determines the nearest public bus stop for each spot.
- **Query Parameters:**
  - `lat`: Optional visitor latitude (float)
  - `lon`: Optional visitor longitude (float)
- **Success (HTTP 200):**
  Returns a JSON object containing:
  - `fetchedAt`: ISO 8601 timestamp of the response generation.
  - `source`: `"LTA DataMall"` or `"built-in fallback list"`.
  - `usingFallback`: Boolean indicating whether the built-in fallback bus stop list was used instead of live LTA DataMall data.
  - `fallbackReason`: `null` if live data succeeded, or a message explaining why the fallback list was substituted (e.g., missing API key, network unreachable, empty dataset).
  - `fallbackSnapshotDate`: `"24 September 2026"` when using fallback, or `null`.
  - `userLocationProvided`: Boolean indicating whether visitor coordinates were supplied.
  - `spots`: Array of spot objects, sorted by straight-line distance if visitor coordinates were supplied. Each spot includes:
    - `name`, `lat`, `lon`, `facing`.
    - `distanceFromUserKm`: Straight-line distance in kilometres rounded to 1 decimal place (or `null` if no location provided).
    - `nearestBusStop`: Object with `code`, `name`, `road`, `metresFromSpot`, and `source` (`"LTA DataMall"` or `"built-in fallback list"`).
- **Failures & Fallback Substitution Handling:**
  - *Missing `LTA_ACCOUNT_KEY`*: Sets `usingFallback: true` with `fallbackReason: "LTA_ACCOUNT_KEY is not configured in the environment."` and populates nearest bus stops from the built-in snapshot taken from LTA DataMall on 24 September 2026 (`Marina Barrage` code 03369 "Gardens by the Bay Stn Exit 1" 202m, `Henderson Waves` code 14259 "Blk 11" 75m, `Siloso Beach, Sentosa` code 14539 "Beach Stn Ter" 1134m, `Bedok Jetty, East Coast Park` code 93151 "Opp Cable Ski Pk" 480m, `Punggol Settlement` code 65709 "Bef SIT Punggol" 65m).
  - *LTA DataMall Unreachable*: Catches network error with reference `'LTA-NET-502'`, sets `usingFallback: true`, and notes failure in `fallbackReason`.
  - *LTA DataMall Refused Request (non-2xx)*: Preserves HTTP error status with reference `'LTA-STOPS-{status}'`, sets `usingFallback: true`, and records the upstream error message.
  - *Empty Dataset Returned*: References `'LTA-EMPTY-DATA'`, sets `usingFallback: true`, and records that an empty dataset was returned.
- **Environment Variables:** `LTA_ACCOUNT_KEY` (optional; if omitted, built-in fallback snapshot list is substituted with visible disclosure and snapshot date).
- **Data Freshness & Caching:**
  - When `usingFallback` is `true`: `Cache-Control: no-store` (ensures temporary failure or missing key responses are never cached).
  - When live LTA DataMall data succeeds: `Cache-Control: s-maxage=86400, stale-while-revalidate=86400` (cached up to 24 hours, in-memory cache TTL 24 hours).

---

### 5. `api/arrivals.js` (Live Bus Service Arrivals)

- **Purpose:** Queries real-time bus arrivals for a specific 5-digit Singapore bus stop code from LTA DataMall v3 API. Translates technical codes into plain English passenger terminology (`"Seats available"`, `"Standing available"`, `"Single deck"`, `"Double deck"`, `"Wheelchair accessible"`, `"Arriving"`, `"X min"`).
- **Query Parameters:**
  - `stopCode`: 5-digit bus stop code (e.g. `'03369'`).
- **Success (HTTP 200):**
  Returns a JSON object containing:
  - `fetchedAt`: ISO 8601 timestamp of the request.
  - `source`: `"LTA DataMall"`.
  - `busStopCode`: The queried 5-digit stop code.
  - `noBusesDue`: Boolean, `true` if the bus stop exists but currently has no arriving buses scheduled.
  - `services`: Array of bus services serving the stop. Each item includes:
    - `serviceNo`: Bus service identifier (e.g. `"400"`).
    - `nextBus`: Object with `arrival` (`"Arriving"` or `"X min"`), `load` (plain English seat availability), `busType`, and `feature` (accessibility).
    - `subsequentBuses`: Array containing arrival estimates for the 2nd and 3rd upcoming buses.
- **Failures & Refusal Handling:**
  - *Missing `LTA_ACCOUNT_KEY`*: HTTP 503 with reference `'LTA-KEY-503'` and message `"LTA_ACCOUNT_KEY environment variable is not configured or empty."`
  - *Invalid Stop Code (not 5 digits)*: HTTP 400 with reference `'LTA-CODE-400'` and message `"Bus stop code must be exactly 5 digits."`
  - *LTA Unreachable*: HTTP 502 with reference `'LTA-NET-502'` and message `"LTA DataMall service could not be reached."`
  - *LTA Refused Request (non-2xx)*: Preserves upstream status code (e.g. 401, 429) with reference `'LTA-REF-{status}'` and descriptive error message.
  - *JSON Parsing Error*: HTTP 502 with reference `'LTA-PARSE-502'`.
- **Environment Variables:** `LTA_ACCOUNT_KEY` (required for querying live bus arrivals).
- **Data Freshness & Caching:** `Cache-Control: no-store` (never cached; strictly real-time arrival estimates).
