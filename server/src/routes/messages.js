import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensureFriends, publicUser, userSelect } from '../lib/social.js';
import { decryptText, encryptText } from '../lib/crypto.js';
import { cleanText } from '../lib/validation.js';

const router = Router();

router.use(authMiddleware);

function serializeMessage(message) {
  return {
    id: message.id,
    content: decryptText(message),
    createdAt: message.createdAt,
    readAt: message.readAt,
    sender: publicUser(message.sender),
    receiver: publicUser(message.receiver),
    mine: message.senderId === message.currentUserId,
  };
}

router.get('/conversations', async (req, res, next) => {
  try {
    const friendships = await prisma.friendRequest.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: req.user.id }, { addresseeId: req.user.id }],
      },
      include: {
        requester: { select: userSelect },
        addressee: { select: userSelect },
      },
    });

    const conversations = await Promise.all(
      friendships.map(async (friendship) => {
        const friend =
          friendship.requesterId === req.user.id ? friendship.addressee : friendship.requester;

        const [latestMessage, unreadCount] = await Promise.all([
          prisma.directMessage.findFirst({
            where: {
              OR: [
                { senderId: req.user.id, receiverId: friend.id },
                { senderId: friend.id, receiverId: req.user.id },
              ],
            },
            orderBy: { createdAt: 'desc' },
            include: {
              sender: { select: userSelect },
              receiver: { select: userSelect },
            },
          }),
          prisma.directMessage.count({
            where: {
              senderId: friend.id,
              receiverId: req.user.id,
              readAt: null,
            },
          }),
        ]);

        return {
          user: publicUser(friend),
          unreadCount,
          latestMessage: latestMessage
            ? serializeMessage({ ...latestMessage, currentUserId: req.user.id })
            : null,
        };
      })
    );

    conversations.sort((a, b) => {
      const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0;
      const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    res.json({ conversations });
  } catch (e) {
    next(e);
  }
});

router.get('/:username', async (req, res, next) => {
  try {
    const friend = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
      select: userSelect,
    });

    if (!friend) return res.status(404).json({ error: 'User not found' });
    if (!(await ensureFriends(req.user.id, friend.id))) {
      return res.status(403).json({ error: 'You can only message friends' });
    }

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: friend.id },
          { senderId: friend.id, receiverId: req.user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        sender: { select: userSelect },
        receiver: { select: userSelect },
      },
    });

    await prisma.directMessage.updateMany({
      where: {
        senderId: friend.id,
        receiverId: req.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    res.json({
      user: publicUser(friend),
      messages: messages.map((message) =>
        serializeMessage({ ...message, currentUserId: req.user.id })
      ),
    });
  } catch (e) {
    next(e);
  }
});

router.post('/:username', async (req, res, next) => {
  try {
    const content = cleanText(req.body.content, 1000);
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const friend = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
      select: userSelect,
    });

    if (!friend) return res.status(404).json({ error: 'User not found' });
    if (!(await ensureFriends(req.user.id, friend.id))) {
      return res.status(403).json({ error: 'You can only message friends' });
    }

    const encrypted = encryptText(content);
    const message = await prisma.directMessage.create({
      data: {
        ...encrypted,
        senderId: req.user.id,
        receiverId: friend.id,
      },
      include: {
        sender: { select: userSelect },
        receiver: { select: userSelect },
      },
    });

    res.status(201).json(serializeMessage({ ...message, currentUserId: req.user.id }));
  } catch (e) {
    next(e);
  }
});

export default router;
