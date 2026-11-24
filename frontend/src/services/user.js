import { currentUser, progress } from '@/mocks/user';
import { mockResponse } from './mock-utils';

// TODO(api): trocar por GET /api/v1/users/me
export function getCurrentUser() {
  return mockResponse(currentUser, 300);
}

// TODO(api): trocar por GET /api/v1/users/me/progress
export function getProgress() {
  return mockResponse(progress);
}
