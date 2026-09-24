/**
 * Health check endpoint.
 * Reports each dependency separately:
 * - Environment variables configured, named individually: NASA_API_KEY and LTA_ACCOUNT_KEY
 * - Upstream reachability status for Open-Meteo, NASA, and LTA DataMall
 * NEVER prints the credential or any part of it.
 * Never throws, and never lets one failing dependency hide the state of the others.
 */

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const nasaKey = process.env.NASA_API_KEY;
  const ltaKey = process.env.LTA_ACCOUNT_KEY;

  const nasaKeyConfigured = Boolean(nasaKey && nasaKey.trim().length > 0);
  const ltaKeyConfigured = Boolean(ltaKey && ltaKey.trim().length > 0);

  // 1. Check Open-Meteo upstream status (no API key required)
  let openMeteoStatus = null;
  try {
    const omRes = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=1.2806&longitude=103.8714&hourly=visibility&forecast_days=1'
    );
    openMeteoStatus = omRes.status;
  } catch (err) {
    openMeteoStatus = 'unreachable';
  }

  // 2. Check NASA upstream status (only if key is configured; otherwise report key missing)
  let nasaStatus = null;
  if (!nasaKeyConfigured) {
    nasaStatus = 'key missing';
  } else {
    try {
      const nasaRes = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(nasaKey.trim())}`
      );
      nasaStatus = nasaRes.status;
    } catch (err) {
      nasaStatus = 'unreachable';
    }
  }

  // 3. Check LTA DataMall upstream status (one small request rather than downloading the bus stops dataset)
  let ltaStatus = null;
  if (!ltaKeyConfigured) {
    ltaStatus = 'key missing';
  } else {
    try {
      const ltaRes = await fetch(
        'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=03369',
        {
          headers: {
            AccountKey: ltaKey.trim(),
            accept: 'application/json'
          }
        }
      );
      ltaStatus = ltaRes.status;
    } catch (err) {
      ltaStatus = 'unreachable';
    }
  }

  res.status(200).json({
    environmentVariables: {
      NASA_API_KEY: nasaKeyConfigured,
      LTA_ACCOUNT_KEY: ltaKeyConfigured
    },
    upstreams: {
      openMeteo: openMeteoStatus,
      nasa: nasaStatus,
      ltaDataMall: ltaStatus
    },
    timestamp: new Date().toISOString()
  });
}

