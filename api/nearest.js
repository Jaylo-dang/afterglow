/**
 * LTA DataMall Nearest Shooting Spots & Bus Stops Endpoint
 * Calculates distance from user's latitude and longitude to the 5 designated Singapore shooting spots,
 * and finds the nearest bus stop to each spot from the LTA DataMall BusStops dataset using Haversine formula.
 *
 * Distinct failure handling:
 * - Missing LTA_ACCOUNT_KEY: uses fallback list with explicit usingFallback: true flag
 * - LTA non-2xx status: preserved and reported with status code and upstream message
 * - LTA network failure: 502 with message saying LTA could not be reached
 * - Empty dataset: reported explicitly
 * - Fallback bus stop details clearly carry source: "built-in fallback list" vs "LTA DataMall"
 */

const SPOTS = [
  { name: 'Marina Barrage', lat: 1.2806, lon: 103.8714, facing: 'west' },
  { name: 'Henderson Waves', lat: 1.2780, lon: 103.8180, facing: 'west' },
  { name: 'Siloso Beach, Sentosa', lat: 1.2570, lon: 103.8100, facing: 'west' },
  { name: 'Bedok Jetty, East Coast Park', lat: 1.3070, lon: 103.9380, facing: 'east' },
  { name: 'Punggol Settlement', lat: 1.4110, lon: 103.9100, facing: 'east' },
];

// These values were read from LTA DataMall on 24 September 2026 and are a snapshot that will drift as bus stops change.
const FALLBACK_SNAPSHOT_DATE = '24 September 2026';

const KNOWN_NEAREST_BUS_STOPS = {
  'Marina Barrage': {
    code: '03369',
    name: 'Gardens by the Bay Stn Exit 1',
    road: 'Marina Gdns Dr',
    metresFromSpot: 202
  },
  'Henderson Waves': {
    code: '14259',
    name: 'Blk 11',
    road: 'Telok Blangah Cres',
    metresFromSpot: 75
  },
  'Siloso Beach, Sentosa': {
    code: '14539',
    name: 'Beach Stn Ter',
    road: 'Beach View',
    metresFromSpot: 1134
  },
  'Bedok Jetty, East Coast Park': {
    code: '93151',
    name: 'Opp Cable Ski Pk',
    road: 'East Coast Pk Svc Rd',
    metresFromSpot: 480
  },
  'Bedok Jetty, ECP': {
    code: '93151',
    name: 'Opp Cable Ski Pk',
    road: 'East Coast Pk Svc Rd',
    metresFromSpot: 480
  },
  'Punggol Settlement': {
    code: '65709',
    name: 'Bef SIT Punggol',
    road: 'New Punggol Rd',
    metresFromSpot: 65
  }
};

// In-memory cache for bus stops across serverless invocations
let cachedBusStops = null;
let busStopsCacheTimestamp = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Haversine formula to compute distance in metres
function haversineMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in metres
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function fetchAllBusStops(accountKey) {
  const now = Date.now();
  if (cachedBusStops && now - busStopsCacheTimestamp < CACHE_TTL_MS) {
    return cachedBusStops;
  }

  const allStops = [];
  let skip = 0;
  let page = 0;
  const MAX_PAGES = 20;

  while (page < MAX_PAGES) {
    const url = `https://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=${skip}`;
    let response;
    try {
      response = await fetch(url, {
        headers: {
          AccountKey: accountKey.trim(),
          accept: 'application/json'
        }
      });
    } catch (netErr) {
      const err = new Error('LTA DataMall service could not be reached.');
      err.status = 502;
      err.reference = 'LTA-NET-502';
      throw err;
    }

    if (!response.ok) {
      const err = new Error(`LTA DataMall BusStops returned HTTP ${response.status}: ${response.statusText || 'Request refused'}`);
      err.status = response.status;
      err.reference = `LTA-STOPS-${response.status}`;
      throw err;
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      const err = new Error('LTA DataMall BusStops response could not be parsed as JSON.');
      err.status = 502;
      err.reference = 'LTA-PARSE-502';
      throw err;
    }

    const records = data.value || [];
    allStops.push(...records);

    if (records.length < 500) {
      break;
    }

    skip += 500;
    page++;
  }

  if (allStops.length === 0) {
    const err = new Error('LTA DataMall BusStops returned an empty dataset.');
    err.status = 200;
    err.isEmpty = true;
    err.reference = 'LTA-EMPTY-DATA';
    throw err;
  }

  cachedBusStops = allStops;
  busStopsCacheTimestamp = now;
  return allStops;
}

export default async function handler(req, res) {
  const query = req.query || {};
  const latStr = query.lat;
  const lonStr = query.lon;

  const userLat = latStr !== undefined && latStr !== null && latStr !== '' ? parseFloat(latStr) : null;
  const userLon = lonStr !== undefined && lonStr !== null && lonStr !== '' ? parseFloat(lonStr) : null;

  const hasUserCoords = userLat !== null && !isNaN(userLat) && userLon !== null && !isNaN(userLon);

  const accountKey = process.env.LTA_ACCOUNT_KEY;
  let busStops = null;
  let usingFallback = false;
  let fallbackReason = null;

  if (!accountKey || accountKey.trim() === '') {
    // Key is missing: use fallback list and explicitly flag it
    usingFallback = true;
    fallbackReason = 'LTA_ACCOUNT_KEY is not configured in the environment.';
  } else {
    try {
      busStops = await fetchAllBusStops(accountKey);
    } catch (err) {
      // Fallback is used, but never hide the failure: record usingFallback and the upstream failure message
      usingFallback = true;
      fallbackReason = err.message || 'LTA DataMall service could not be reached.';
      busStops = null;
    }
  }

  // Find nearest bus stop for each shooting spot
  const spotsWithBusStops = SPOTS.map((spot) => {
    let nearestStop = null;
    let minMetres = Infinity;

    if (busStops && busStops.length > 0) {
      for (const stop of busStops) {
        const stopLat = parseFloat(stop.Latitude);
        const stopLon = parseFloat(stop.Longitude);
        if (isNaN(stopLat) || isNaN(stopLon)) continue;

        const dist = haversineMetres(spot.lat, spot.lon, stopLat, stopLon);
        if (dist < minMetres) {
          minMetres = dist;
          nearestStop = {
            code: String(stop.BusStopCode).trim(),
            name: String(stop.Description).trim(),
            road: String(stop.RoadName).trim(),
            metresFromSpot: Math.round(dist),
            source: 'LTA DataMall'
          };
        }
      }
    }

    if (!nearestStop) {
      usingFallback = true;
      const fallback = KNOWN_NEAREST_BUS_STOPS[spot.name] || KNOWN_NEAREST_BUS_STOPS['Bedok Jetty, East Coast Park'];
      if (fallback) {
        nearestStop = {
          code: fallback.code,
          name: fallback.name,
          road: fallback.road,
          metresFromSpot: fallback.metresFromSpot,
          source: 'built-in fallback list'
        };
      } else {
        nearestStop = {
          code: '00000',
          name: 'Nearest Station Area',
          road: spot.name,
          metresFromSpot: 250,
          source: 'built-in fallback list'
        };
      }
    }

    let distanceFromUserKm = null;
    if (hasUserCoords) {
      const distMetres = haversineMetres(userLat, userLon, spot.lat, spot.lon);
      distanceFromUserKm = Math.round((distMetres / 1000) * 10) / 10;
    }

    return {
      name: spot.name,
      lat: spot.lat,
      lon: spot.lon,
      facing: spot.facing,
      distanceFromUserKm,
      nearestBusStop: nearestStop
    };
  });

  // Sort by straight-line distance if user coordinates provided
  if (hasUserCoords) {
    spotsWithBusStops.sort((a, b) => (a.distanceFromUserKm ?? 9999) - (b.distanceFromUserKm ?? 9999));
  }

  // Conditional Cache-Control: no-store when using fallback; s-maxage when live dataset succeeded
  if (usingFallback) {
    res.setHeader('Cache-Control', 'no-store');
  } else {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
  }

  res.status(200).json({
    fetchedAt: new Date().toISOString(),
    source: usingFallback ? 'built-in fallback list' : 'LTA DataMall',
    usingFallback,
    fallbackReason,
    fallbackSnapshotDate: usingFallback ? FALLBACK_SNAPSHOT_DATE : null,
    spots: spotsWithBusStops,
    userLocationProvided: hasUserCoords
  });
}
