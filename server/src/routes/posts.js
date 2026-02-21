import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, getOptionalUser } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const cursor = req.query.cursor;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const currentUserId = getOptionalUser(req);

    const posts = await prisma.post.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
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

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const mapped = items.map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt,
      user: p.user,
      commentCount: p._count.comments,
      likeCount: p._count.likes,
      likedByMe: Array.isArray(p.likes) && p.likes.length > 0,
    }));

    res.json({ posts: mapped, nextCursor });
  } catch (e) {
    next(e);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Post content is required' });
    }
    const post = await prisma.post.create({
      data: { content: content.trim(), userId: req.user.id },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { comments: true, likes: true } },
      },
    });
    res.status(201).json({
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      user: post.user,
      commentCount: post._count.comments,
      likeCount: post._count.likes,
      likedByMe: false,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const currentUserId = getOptionalUser(req);
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
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
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      user: post.user,
      commentCount: post._count.comments,
      likeCount: post._count.likes,
      likedByMe: Array.isArray(post.likes) && post.likes.length > 0,
    });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== req.user.id) return res.status(403).json({ error: 'Not allowed to delete this post' });
    await prisma.post.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.post('/:id/like', authMiddleware, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId: req.user.id } },
    });
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    }
    await prisma.like.create({ data: { postId, userId: req.user.id } });
    res.json({ liked: true });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/comments', async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    res.json({ comments });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/comments', authMiddleware, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const comment = await prisma.comment.create({
      data: { content: content.trim(), postId: req.params.id, userId: req.user.id },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

export default router;
