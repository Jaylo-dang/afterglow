/**
 * Open-Meteo Sky Conditions Endpoint for Singapore Sunset and Sunrise
 * Handles multi-location forecast queries across 5 designated shooting spots.
 */

const SPOTS = [
  { name: 'Marina Barrage', lat: 1.2806, lon: 103.8714, facing: 'west' },
  { name: 'Henderson Waves', lat: 1.2780, lon: 103.8180, facing: 'west' },
  { name: 'Siloso Beach, Sentosa', lat: 1.2570, lon: 103.8100, facing: 'west' },
  { name: 'Bedok Jetty, East Coast Park', lat: 1.3070, lon: 103.9380, facing: 'east' },
  { name: 'Punggol Settlement', lat: 1.4110, lon: 103.9100, facing: 'east' },
];

export default async function handler(req, res) {
  // Query parameters: mode ('sunset' or 'sunrise'), optional date ('YYYY-MM-DD')
  const query = req.query || {};
  const mode = query.mode === 'sunrise' ? 'sunrise' : 'sunset';
  const requestedDate = query.date ? String(query.date).trim() : null;

  // Set Cache-Control as required: 30 minutes cache, 1 hour stale-while-revalidate
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  // Build comma-separated coordinates for multi-location call
  const lats = SPOTS.map(s => s.lat).join(',');
  const lons = SPOTS.map(s => s.lon).join(',');

  const upstreamUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=sunrise,sunset&hourly=cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility&timezone=Asia/Singapore&forecast_days=7`;

  let response;
  try {
    response = await fetch(upstreamUrl);
  } catch (networkErr) {
    res.status(502).json({
      error: 'Upstream Unreachable',
      status: 502,
      message: 'Open-Meteo could not be reached at all'
    });
    return;
  }

  // Check response.ok BEFORE reading body
  if (!response.ok) {
    res.status(response.status).json({
      error: 'Upstream Refused',
      status: response.status,
      message: `Open-Meteo returned HTTP ${response.status}: ${response.statusText || 'Request failed'}`
    });
    return;
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    res.status(502).json({
      error: 'Invalid Upstream Response',
      status: 502,
      message: 'Open-Meteo response could not be parsed as JSON'
    });
    return;
  }

  // Open-Meteo returns an ARRAY of objects for multi-location requests.
  // Match spots by ARRAY INDEX ONLY, never by location_id.
  const resultsArray = Array.isArray(data) ? data : [data];

  // Inspect available daily dates from first valid spot
  const sampleSpotData = resultsArray.find(d => d && d.daily && Array.isArray(d.daily.time));
  const availableDates = sampleSpotData?.daily?.time || [];

  let dayIndex = 0;
  if (requestedDate) {
    dayIndex = availableDates.indexOf(requestedDate);
    if (dayIndex === -1) {
      // Requested date is out of range of the 7-day free tier forecast
      res.status(200).json({
        outOfRange: true,
        requestedDate,
        message: 'The forecast does not cover the requested day, because the free tier only goes seven days ahead',
        availableDates
      });
      return;
    }
  }

  const processedSpots = [];
  const missingSpots = [];

  for (let i = 0; i < SPOTS.length; i++) {
    const spotMeta = SPOTS[i];
    const spotResult = resultsArray[i];

    if (!spotResult || !spotResult.hourly || !spotResult.daily) {
      missingSpots.push(spotMeta.name);
      continue;
    }

    const daily = spotResult.daily;
    const hourly = spotResult.hourly;

    const eventTimes = mode === 'sunrise' ? daily.sunrise : daily.sunset;
    const eventTime = eventTimes?.[dayIndex];

    if (!eventTime) {
      missingSpots.push(spotMeta.name);
      continue;
    }

    // Match the date and hour of daily event time against hourly.time (e.g. "2026-09-12T19")
    const targetHourPrefix = eventTime.slice(0, 13);
    let hourIdx = hourly.time?.findIndex(t => typeof t === 'string' && t.startsWith(targetHourPrefix));

    if (hourIdx === -1 || hourIdx === undefined) {
      // Fallback: match date prefix
      hourIdx = hourly.time?.findIndex(t => typeof t === 'string' && t.startsWith(eventTime.slice(0, 10)));
      if (hourIdx === -1) hourIdx = 0;
    }

    const rawLow = hourly.cloud_cover_low?.[hourIdx] ?? 0;
    const rawMid = hourly.cloud_cover_mid?.[hourIdx] ?? 0;
    const rawHigh = hourly.cloud_cover_high?.[hourIdx] ?? 0;
    const rawVisMetres = hourly.visibility?.[hourIdx] ?? 0;

    // Visibility rule: in METRES. Divide by 1000 before displaying. Never show > 100 km.
    const rawVisKm = rawVisMetres / 1000;
    const visKmClamped = Math.min(100, Math.round(rawVisKm * 10) / 10);

    // Exact score rule:
    // midHigh    = (cloud_cover_mid + cloud_cover_high) / 2
    // midHighPts = 100 - Math.abs(midHigh - 50) * 2
    // lowPts     = Math.max(0, 100 - cloud_cover_low * 2.5)
    // visKm      = visibility / 1000
    // visPts     = Math.min(100, visKm / 20 * 100)
    // score      = Math.round(0.5*midHighPts + 0.3*lowPts + 0.2*visPts)
    const midHigh = (rawMid + rawHigh) / 2;
    const midHighPts = 100 - Math.abs(midHigh - 50) * 2;
    const lowPts = Math.max(0, 100 - rawLow * 2.5);
    const visPts = Math.min(100, (rawVisMetres / 1000) / 20 * 100);
    const scoreVal = Math.round(0.5 * midHighPts + 0.3 * lowPts + 0.2 * visPts);
    const score = Math.max(0, Math.min(100, scoreVal));

    processedSpots.push({
      name: spotMeta.name,
      lat: spotMeta.lat,
      lon: spotMeta.lon,
      facing: spotMeta.facing,
      score,
      eventTime,
      raw: {
        cloud_cover_low: rawLow,
        cloud_cover_mid: rawMid,
        cloud_cover_high: rawHigh,
        visibility_metres: rawVisMetres,
        visibility_km: visKmClamped
      }
    });
  }

  // Filter spots by facing for selected mode:
  // Sunrise mode ranks only the east-facing spots; sunset mode ranks only the west-facing spots.
  const targetFacing = mode === 'sunrise' ? 'east' : 'west';
  const eligibleSpots = processedSpots.filter(s => s.facing === targetFacing);

  // Best first: sort descending by score
  eligibleSpots.sort((a, b) => b.score - a.score);

  const primarySpot = eligibleSpots[0] || processedSpots[0] || null;
  const primaryEventTime = primarySpot?.eventTime || sampleSpotData?.daily?.[mode === 'sunrise' ? 'sunrise' : 'sunset']?.[dayIndex] || '';

  res.status(200).json({
    mode,
    outOfRange: false,
    date: availableDates[dayIndex] || requestedDate || '',
    availableDates,
    eventTime: primaryEventTime,
    rankedSpots: eligibleSpots,
    allSpots: processedSpots,
    missingSpots
  });
}
