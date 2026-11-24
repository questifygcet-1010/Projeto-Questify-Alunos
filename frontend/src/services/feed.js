import { activities } from '@/mocks/home';
import { mockList, mockResponse } from './mock-utils';

// TODO(api): trocar por GET /api/v1/feed
export function listActivities() {
  return mockList(activities);
}

// TODO(api): trocar por POST /api/v1/feed/posts (o post só existe em memória por enquanto)
export function publishPost({ text, author }) {
  return mockResponse(
    {
      id: `a-post-${Date.now()}`,
      type: 'post',
      author,
      action: 'publicou',
      time: 'agora',
      text,
      tags: [],
      likes: 0,
      liked: false,
      comments: 0,
    },
    300,
  );
}

// TODO(api): trocar por POST/DELETE /api/v1/feed/:id/like
export function setLiked(id, liked) {
  return mockResponse({ id, liked }, 150);
}

// TODO(api): trocar por POST /api/v1/feed/:id/comments
export function addComment(id, text) {
  return mockResponse({ id, text }, 200);
}

// TODO(api): trocar por POST /api/v1/challenges/:id/accept
export function acceptChallenge(id) {
  return mockResponse({ id, accepted: true }, 300);
}
