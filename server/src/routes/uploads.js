import { Router } from 'express';
import crypto from 'crypto';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MEDIA_TYPES = {
  'image/avif': { ext: '.avif', type: 'IMAGE' },
  'image/gif': { ext: '.gif', type: 'IMAGE' },
  'image/jpeg': { ext: '.jpg', type: 'IMAGE' },
  'image/png': { ext: '.png', type: 'IMAGE' },
  'image/webp': { ext: '.webp', type: 'IMAGE' },
  'video/mp4': { ext: '.mp4', type: 'VIDEO' },
  'video/ogg': { ext: '.ogg', type: 'VIDEO' },
  'video/quicktime': { ext: '.mov', type: 'VIDEO' },
  'video/webm': { ext: '.webm', type: 'VIDEO' },
  'video/x-m4v': { ext: '.m4v', type: 'VIDEO' },
};

function uploadBaseUrl(req) {
  return process.env.PUBLIC_API_ORIGIN || `${req.protocol}://${req.get('host')}`;
}

router.post('/media', authMiddleware, async (req, res, next) => {
  try {
    const { data, mimeType } = req.body;
    const media = MEDIA_TYPES[mimeType];

    if (!media) {
      return res.status(400).json({ error: 'Please upload a supported image or video file' });
    }

    if (!data || typeof data !== 'string') {
      return res.status(400).json({ error: 'Upload data is required' });
    }

    const base64 = data.includes(',') ? data.split(',').pop() : data;
    const buffer = Buffer.from(base64, 'base64');

    if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ error: 'Uploads must be 25MB or smaller' });
    }

    const fileName = `${req.user.id}-${crypto.randomUUID()}${media.ext}`;
    const uploadDir = path.resolve(process.cwd(), 'uploads', 'media');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer, { flag: 'wx' });

    res.status(201).json({
      mediaUrl: `${uploadBaseUrl(req)}/uploads/media/${fileName}`,
      mediaType: media.type,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
