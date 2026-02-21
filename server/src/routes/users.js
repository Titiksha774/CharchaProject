import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/:username', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { _count, ...profile } = user;
    res.json({ ...profile, postCount: _count.posts });
  } catch (e) {
    next(e);
  }
});

router.get('/:username/posts', async (req, res, next) => {
  try {
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
      },
    });
    res.json({
      posts: posts.map((p) => ({
        id: p.id,
        content: p.content,
        createdAt: p.createdAt,
        user: p.user,
        commentCount: p._count.comments,
        likeCount: p._count.likes,
        likedByMe: false,
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
