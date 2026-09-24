/**
 * LTA DataMall Live Bus Arrivals Endpoint
 * Queries live bus arrivals for a 5-digit bus stop code.
 * Translates load, type, and feature codes into plain English passenger language on the server.
 * Never caches arrivals: Cache-Control: no-store.
 */

// LTA Code Translations
function translateLoad(loadCode) {
  switch (loadCode) {
    case 'SEA':
      return 'Seats available';
    case 'SDA':
      return 'Standing available';
    case 'LSD':
      return 'Limited standing';
    default:
      return 'Seats available';
  }
}

function translateType(typeCode) {
  switch (typeCode) {
    case 'SD':
      return 'Single deck';
    case 'DD':
      return 'Double deck';
    case 'BD':
      return 'Bendy bus';
    default:
      return 'Single deck';
  }
}

function translateFeature(featureCode) {
  if (featureCode === 'WAB') {
    return 'Wheelchair accessible';
  }
  return 'Standard access';
}

function parseMinutesUntil(estimatedArrivalStr) {
  if (!estimatedArrivalStr || typeof estimatedArrivalStr !== 'string' || estimatedArrivalStr.trim() === '') {
    return null;
  }

  const arrivalTime = new Date(estimatedArrivalStr).getTime();
  if (isNaN(arrivalTime)) {
    return null;
  }

  const now = Date.now();
  const diffSeconds = Math.round((arrivalTime - now) / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);

  if (diffMinutes <= 0) {
    return 'Arriving';
  }
  return `${diffMinutes} min`;
}

export default async function handler(req, res) {
  // Bus arrivals are real-time; never cache
  res.setHeader('Cache-Control', 'no-store');

  // Situation 1: Check LTA_ACCOUNT_KEY before calling upstream
  const accountKey = process.env.LTA_ACCOUNT_KEY;
  if (!accountKey || accountKey.trim() === '') {
    res.status(503).json({
      error: 'Configuration Missing',
      status: 503,
      reference: 'LTA-KEY-503',
      message: 'LTA_ACCOUNT_KEY environment variable is not configured or empty.'
    });
    return;
  }

  const query = req.query || {};
  const stopCode = query.stopCode ? String(query.stopCode).trim() : '';

  // Situation 2: Stop code not five digits (rule check)
  if (!/^\d{5}$/.test(stopCode)) {
    res.status(400).json({
      error: 'Invalid Stop Code',
      status: 400,
      reference: 'LTA-CODE-400',
      message: 'Bus stop code must be exactly 5 digits.'
    });
    return;
  }

  const upstreamUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(stopCode)}`;

  let response;
  try {
    response = await fetch(upstreamUrl, {
      headers: {
        AccountKey: accountKey.trim(),
        accept: 'application/json'
      }
    });
  } catch (networkErr) {
    // Situation 3: LTA could not be reached at all
    res.status(502).json({
      error: 'Upstream Unreachable',
      status: 502,
      reference: 'LTA-NET-502',
      message: 'LTA DataMall service could not be reached.'
    });
    return;
  }

  // Situation 4: LTA answered but refused (401 bad key, 429 too many requests, etc.)
  if (!response.ok) {
    const errorStatus = response.status;
    const refCode = `LTA-REF-${errorStatus}`;
    res.status(errorStatus).json({
      error: 'Upstream Refused',
      status: errorStatus,
      reference: refCode,
      message: `LTA DataMall service refused the request with HTTP ${errorStatus}: ${response.statusText || 'Request refused'}.`
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
      reference: 'LTA-PARSE-502',
      message: 'LTA DataMall response could not be parsed as JSON.'
    });
    return;
  }

  const servicesRaw = Array.isArray(data.Services) ? data.Services : [];

  const services = [];

  for (const s of servicesRaw) {
    const serviceNo = String(s.ServiceNo || '').trim();
    if (!serviceNo) continue;

    const nextBusRaw = s.NextBus || {};
    const arrivalText = parseMinutesUntil(nextBusRaw.EstimatedArrival);

    // Skip bus if estimated arrival was missing or invalid
    if (!arrivalText) {
      continue;
    }

    const load = translateLoad(nextBusRaw.Load);
    const busType = translateType(nextBusRaw.Type);
    const feature = translateFeature(nextBusRaw.Feature);

    const bus2ArrivalText = s.NextBus2 ? parseMinutesUntil(s.NextBus2.EstimatedArrival) : null;
    const bus3ArrivalText = s.NextBus3 ? parseMinutesUntil(s.NextBus3.EstimatedArrival) : null;

    services.push({
      serviceNo,
      nextBus: {
        arrival: arrivalText,
        load,
        busType,
        feature
      },
      subsequentBuses: [bus2ArrivalText, bus3ArrivalText].filter(Boolean)
    });
  }

  // Situation 5: The stop is real and no buses are due -> 200 with empty services and flag
  const noBusesDue = services.length === 0;

  res.status(200).json({
    fetchedAt: new Date().toISOString(),
    source: 'LTA DataMall',
    busStopCode: stopCode,
    noBusesDue,
    services
  });
}
