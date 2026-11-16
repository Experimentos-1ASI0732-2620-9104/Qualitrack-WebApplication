import { TranslateService } from '@ngx-translate/core';
import { BatchStore } from '../application/batch.store';

/**
 * Name of the person behind a user account, as the batch views show it.
 *
 * @remarks
 * Staff members are shown by their full name. The signed-in user is marked as "you"; when they are not in the staff
 * list (for example the quality manager who owns the laboratory) their username is used. Any other account keeps its
 * id.
 *
 * @param store - The batch store, which knows the staff of the laboratory and the signed-in user
 * @param translate - The translation service
 * @param userId - The user account; null when the record has none
 * @returns The text that names the person, or a dash when there is no account
 */
export function personLabel(
  store: BatchStore,
  translate: TranslateService,
  userId: number | null,
): string {
  if (userId === null) return '—';
  const name = store.personName(userId);
  if (store.isCurrentUser(userId)) {
    return translate.instant('batches.people.you', {
      name: name ?? store.currentUsername() ?? `#${userId}`,
    });
  }
  return name ?? translate.instant('batches.people.user', { id: userId });
}
