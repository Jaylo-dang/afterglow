/**
 * Health check endpoint.
 * Reports keyConfigured for NASA_API_KEY as a boolean, the HTTP status each of
 * the two upstreams returned, and a timestamp.
 * NEVER prints the credential or any part of it.
 */

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const apiKey = process.env.NASA_API_KEY;
  const keyConfigured = Boolean(apiKey && apiKey.trim().length > 0);

  // Check Open-Meteo upstream status
  let openMeteoStatus = null;
  try {
    const omRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=1.2806&longitude=103.8714&hourly=visibility&forecast_days=1');
    openMeteoStatus = omRes.status;
  } catch (err) {
    openMeteoStatus = 'unreachable';
  }

  // Check NASA upstream status if key is configured
  let nasaStatus = null;
  if (!keyConfigured) {
    nasaStatus = 503;
  } else {
    try {
      const nasaRes = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(apiKey.trim())}`);
      nasaStatus = nasaRes.status;
    } catch (err) {
      nasaStatus = 'unreachable';
    }
  }

  res.status(200).json({
    keyConfigured,
    upstreams: {
      openMeteo: openMeteoStatus,
      nasa: nasaStatus
    },
    timestamp: new Date().toISOString()
  });
}
