import { prisma } from './prisma.js';

export const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  location: true,
  website: true,
};

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    location: user.location,
    website: user.website,
  };
}

export async function getFriendship(currentUserId, otherUserId) {
  if (!currentUserId || !otherUserId || currentUserId === otherUserId) return null;
  return prisma.friendRequest.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, addresseeId: otherUserId },
        { requesterId: otherUserId, addresseeId: currentUserId },
      ],
    },
  });
}

export function relationshipFromFriendship(currentUserId, friendship) {
  if (!friendship) return 'none';
  if (friendship.status === 'ACCEPTED') return 'friends';
  if (friendship.status === 'PENDING') {
    return friendship.requesterId === currentUserId ? 'outgoing_request' : 'incoming_request';
  }
  return 'none';
}

export async function getRelationshipStatus(currentUserId, otherUserId) {
  if (!currentUserId) return 'none';
  if (currentUserId === otherUserId) return 'self';
  const friendship = await getFriendship(currentUserId, otherUserId);
  return relationshipFromFriendship(currentUserId, friendship);
}

export async function ensureFriends(currentUserId, otherUserId) {
  const friendship = await getFriendship(currentUserId, otherUserId);
  return Boolean(friendship && friendship.status === 'ACCEPTED');
}

export function otherFriendUser(currentUserId, friendship) {
  return friendship.requesterId === currentUserId ? friendship.addressee : friendship.requester;
}
