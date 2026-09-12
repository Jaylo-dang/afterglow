/**
 * NASA Astronomy Picture of the Day (APOD) Endpoint
 * Reads NASA_API_KEY from environment, verifies before upstream fetch,
 * conditionally formats image credit, and handles media types.
 */

export default async function handler(req, res) {
  // Read NASA_API_KEY directly from environment variable
  const apiKey = process.env.NASA_API_KEY;

  // BEFORE the fetch, check if the variable is missing or empty.
  // Return 503 naming NASA_API_KEY and do NOT call upstream at all.
  if (!apiKey || apiKey.trim() === '') {
    res.status(503).json({
      error: 'Configuration Missing',
      status: 503,
      message: 'NASA_API_KEY environment variable is not configured or empty'
    });
    return;
  }

  const upstreamUrl = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(apiKey.trim())}`;

  let response;
  try {
    response = await fetch(upstreamUrl);
  } catch (networkErr) {
    res.status(502).json({
      error: 'Upstream Unreachable',
      status: 502,
      message: 'NASA APOD upstream could not be reached at all'
    });
    return;
  }

  // Check response.ok BEFORE reading the body
  if (!response.ok) {
    res.status(response.status).json({
      error: 'Upstream Refused',
      status: response.status,
      message: `NASA APOD returned HTTP ${response.status}: ${response.statusText || 'Request refused'}`
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
      message: 'NASA APOD response could not be parsed as JSON'
    });
    return;
  }

  // Credit formatting:
  // "The "copyright" field is CONDITIONAL. It is ABSENT on days when the image
  // belongs to NASA, and PRESENT when an outside photographer took it.
  // When it is present show "Image: " followed by that value with its line breaks removed;
  // when it is absent show "Image: NASA"."
  let credit = 'Image: NASA';
  if (data && typeof data.copyright === 'string' && data.copyright.trim().length > 0) {
    const cleanCopyright = data.copyright.replace(/[\r\n]+/g, ' ').trim();
    credit = `Image: ${cleanCopyright}`;
  }

  // Cache: s-maxage=3600, stale-while-revalidate=7200
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  res.status(200).json({
    date: data.date || '',
    title: data.title || '',
    explanation: data.explanation || '',
    url: data.url || '',
    media_type: data.media_type || 'image',
    credit
  });
}
