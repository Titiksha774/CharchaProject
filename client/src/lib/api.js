/**
 * Parse response as JSON. Handles empty or invalid body to avoid "Unexpected end of JSON input".
 */
export async function parseJson(res) {
  const text = await res.text();
  if (!text || text.trim() === '') return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
