import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, getOptionalUser } from '../middleware/auth.js';
import { getRelationshipStatus } from '../lib/social.js';

const router = Router();

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

function cleanOptional(value, maxLength) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const cleaned = String(value).trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

function profileSelect() {
  return {
    id: true,
    email: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    location: true,
    website: true,
  };
}

router.patch('/me', authMiddleware, async (req, res, next) => {
  try {
    const email = req.body.email === undefined ? undefined : String(req.body.email).trim().toLowerCase();
    const username =
      req.body.username === undefined ? undefined : String(req.body.username).trim().toLowerCase();
    const displayName =
      req.body.displayName === undefined ? undefined : String(req.body.displayName).trim();

    if (email !== undefined && !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (username !== undefined && !USERNAME_RE.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-24 characters using lowercase letters, numbers, or underscores',
      });
    }

    if (displayName !== undefined && displayName.length < 2) {
      return res.status(400).json({ error: 'Display name must be at least 2 characters' });
    }

    if (email !== undefined || username !== undefined) {
      const existing = await prisma.user.findFirst({
        where: {
          id: { not: req.user.id },
          OR: [
            ...(email !== undefined ? [{ email }] : []),
            ...(username !== undefined ? [{ username }] : []),
          ],
        },
      });

      if (existing) return res.status(400).json({ error: 'Email or username is already in use' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(email !== undefined ? { email } : {}),
        ...(username !== undefined ? { username } : {}),
        ...(displayName !== undefined ? { displayName } : {}),
        ...(req.body.avatarUrl !== undefined ? { avatarUrl: cleanOptional(req.body.avatarUrl, 500) } : {}),
        ...(req.body.bio !== undefined ? { bio: cleanOptional(req.body.bio, 180) } : {}),
        ...(req.body.location !== undefined ? { location: cleanOptional(req.body.location, 80) } : {}),
        ...(req.body.website !== undefined ? { website: cleanOptional(req.body.website, 160) } : {}),
      },
      select: profileSelect(),
    });

    res.json({ user });
  } catch (e) {
    next(e);
  }
});

router.get('/:username', async (req, res, next) => {
  try {
    const currentUserId = getOptionalUser(req);
    const user = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        website: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [friendCount, relationship] = await Promise.all([
      prisma.friendRequest.count({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: user.id }, { addresseeId: user.id }],
        },
      }),
      getRelationshipStatus(currentUserId, user.id),
    ]);
    const { _count, ...profile } = user;
    res.json({ ...profile, postCount: _count.posts, friendCount, relationship });
  } catch (e) {
    next(e);
  }
});

router.get('/:username/posts', async (req, res, next) => {
  try {
    const currentUserId = getOptionalUser(req);
    const user = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
      select: { id: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { comments: true, likes: true } },
        ...(currentUserId
          ? { likes: { where: { userId: currentUserId }, select: { id: true } } }
          : {}),
      },
    });
    res.json({
      posts: posts.map((p) => ({
        id: p.id,
        content: p.content,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
        createdAt: p.createdAt,
        user: p.user,
        commentCount: p._count.comments,
        likeCount: p._count.likes,
        likedByMe: Array.isArray(p.likes) && p.likes.length > 0,
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
