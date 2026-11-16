import { TranslateService } from '@ngx-translate/core';
import { BatchStore } from '../application/batch.store';
import { personLabel } from './batch-people';

describe('personLabel', () => {
  const store = {
    personName: (userId: number | null) =>
      userId === 31 ? 'Luis Quispe' : userId === 27 ? 'María Torres' : null,
    isCurrentUser: (userId: number | null) => userId === 27 || userId === 40,
    currentUsername: () => 'qa.owner',
  } as unknown as BatchStore;
  const translate = {
    instant: (key: string, params: Record<string, unknown>) => `${key}:${JSON.stringify(params)}`,
  } as unknown as TranslateService;

  it('names staff members and marks the signed-in user', () => {
    expect(personLabel(store, translate, 31)).toBe('Luis Quispe');
    expect(personLabel(store, translate, 27)).toBe('batches.people.you:{"name":"María Torres"}');
  });

  it('uses the username of the signed-in user who is not in the staff', () => {
    expect(personLabel(store, translate, 40)).toBe('batches.people.you:{"name":"qa.owner"}');
  });

  it('keeps the id of other accounts and a dash when there is none', () => {
    expect(personLabel(store, translate, 99)).toBe('batches.people.user:{"id":99}');
    expect(personLabel(store, translate, null)).toBe('—');
  });
});
