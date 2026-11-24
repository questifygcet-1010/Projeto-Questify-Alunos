import { quests } from '@/mocks/home';
import { mockList, mockResponse } from './mock-utils';

// TODO(api): trocar por GET /api/v1/quests?mine=true
export function listQuests() {
  return mockList(quests);
}

// TODO(api): trocar por POST /api/v1/quests/:id/start
export function startQuest(id) {
  return mockResponse({ id, status: 'in_progress' }, 300);
}

// TODO(api): trocar por POST /api/v1/quests/:id/proof (upload do comprovante)
export function submitQuestProof(id) {
  return mockResponse({ id, status: 'in_review' }, 300);
}
