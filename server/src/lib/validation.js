const IMAGE_EXTENSIONS = /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i;
const VIDEO_EXTENSIONS = /\.(mp4|mov|m4v|webm|ogg)(\?.*)?$/i;

export function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function parseMediaInput(mediaUrl, mediaType) {
  const url = cleanText(mediaUrl, 1000);
  const type = cleanText(mediaType, 20).toUpperCase();

  if (!url && !type) return { mediaUrl: null, mediaType: null };
  if (!url || !['IMAGE', 'VIDEO'].includes(type)) {
    throw Object.assign(new Error('Choose an image or video type and provide a media URL'), {
      status: 400,
    });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw Object.assign(new Error('Media URL must be a valid URL'), { status: 400 });
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw Object.assign(new Error('Media URL must use http or https'), { status: 400 });
  }

  if (
    process.env.NODE_ENV === 'production' &&
    parsed.protocol !== 'https:' &&
    !['localhost', '127.0.0.1'].includes(parsed.hostname)
  ) {
    throw Object.assign(new Error('Media URL must use https in production'), { status: 400 });
  }

  if (type === 'IMAGE' && !IMAGE_EXTENSIONS.test(parsed.pathname)) {
    throw Object.assign(new Error('Image URLs must end with png, jpg, jpeg, gif, webp, or avif'), {
      status: 400,
    });
  }

  if (type === 'VIDEO' && !VIDEO_EXTENSIONS.test(parsed.pathname)) {
    throw Object.assign(new Error('Video URLs must end with mp4, mov, m4v, webm, or ogg'), {
      status: 400,
    });
  }

  return { mediaUrl: parsed.toString(), mediaType: type };
}
