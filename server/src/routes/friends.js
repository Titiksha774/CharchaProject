import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  getFriendship,
  getRelationshipStatus,
  otherFriendUser,
  publicUser,
  relationshipFromFriendship,
  userSelect,
} from '../lib/social.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const friendships = await prisma.friendRequest.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: req.user.id }, { addresseeId: req.user.id }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        requester: { select: userSelect },
        addressee: { select: userSelect },
      },
    });

    res.json({
      friends: friendships.map((friendship) => ({
        friendshipId: friendship.id,
        since: friendship.updatedAt,
        user: publicUser(otherFriendUser(req.user.id, friendship)),
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/requests', async (req, res, next) => {
  try {
    const requests = await prisma.friendRequest.findMany({
      where: {
        status: 'PENDING',
        OR: [{ requesterId: req.user.id }, { addresseeId: req.user.id }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: userSelect },
        addressee: { select: userSelect },
      },
    });

    res.json({
      incoming: requests
        .filter((request) => request.addresseeId === req.user.id)
        .map((request) => ({
          id: request.id,
          createdAt: request.createdAt,
          user: publicUser(request.requester),
        })),
      outgoing: requests
        .filter((request) => request.requesterId === req.user.id)
        .map((request) => ({
          id: request.id,
          createdAt: request.createdAt,
          user: publicUser(request.addressee),
        })),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ users: [] });

    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { username: 'asc' },
      take: 12,
      select: userSelect,
    });

    const usersWithRelationship = await Promise.all(
      users.map(async (user) => ({
        ...publicUser(user),
        relationship: await getRelationshipStatus(req.user.id, user.id),
      }))
    );

    res.json({ users: usersWithRelationship });
  } catch (e) {
    next(e);
  }
});

router.post('/:username/request', async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
      select: userSelect,
    });

    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'You cannot add yourself' });

    const existing = await getFriendship(req.user.id, target.id);
    if (existing?.status === 'ACCEPTED') {
      return res.status(409).json({ error: 'You are already friends', relationship: 'friends' });
    }

    if (existing?.status === 'PENDING') {
      if (existing.addresseeId === req.user.id) {
        const accepted = await prisma.friendRequest.update({
          where: { id: existing.id },
          data: { status: 'ACCEPTED' },
        });
        return res.json({
          relationship: relationshipFromFriendship(req.user.id, accepted),
          request: accepted,
        });
      }

      return res.status(409).json({
        error: 'Friend request already sent',
        relationship: 'outgoing_request',
      });
    }

    const request = existing
      ? await prisma.friendRequest.update({
          where: { id: existing.id },
          data: {
            requesterId: req.user.id,
            addresseeId: target.id,
            status: 'PENDING',
          },
        })
      : await prisma.friendRequest.create({
          data: {
            requesterId: req.user.id,
            addresseeId: target.id,
          },
        });

    res.status(201).json({ relationship: 'outgoing_request', request });
  } catch (e) {
    next(e);
  }
});

router.post('/requests/:id/accept', async (req, res, next) => {
  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.addresseeId !== req.user.id || request.status !== 'PENDING') {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const accepted = await prisma.friendRequest.update({
      where: { id: request.id },
      data: { status: 'ACCEPTED' },
      include: {
        requester: { select: userSelect },
        addressee: { select: userSelect },
      },
    });

    res.json({
      friendshipId: accepted.id,
      relationship: 'friends',
      user: publicUser(accepted.requester),
    });
  } catch (e) {
    next(e);
  }
});

router.post('/requests/:id/decline', async (req, res, next) => {
  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.addresseeId !== req.user.id || request.status !== 'PENDING') {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await prisma.friendRequest.update({
      where: { id: request.id },
      data: { status: 'DECLINED' },
    });

    res.json({ relationship: 'none' });
  } catch (e) {
    next(e);
  }
});

router.delete('/:username', async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
      select: { id: true },
    });
    if (!target) return res.status(404).json({ error: 'User not found' });

    const friendship = await getFriendship(req.user.id, target.id);
    if (!friendship || friendship.status === 'DECLINED') {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    await prisma.friendRequest.delete({ where: { id: friendship.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
