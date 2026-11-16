import { StatusChipTone } from '../../shared/presentation/components/status-chip/status-chip';
import { BatchStatus } from '../domain/model/batch.entity';

/**
 * How a batch status is shown: the tone, icon and label of its chip.
 */
export interface BatchStatusChipStyle {
  tone: StatusChipTone;
  icon: string;
  labelKey: string;
}

/**
 * Statuses of a batch in the order of its life cycle.
 */
export const BATCH_STATUSES: readonly BatchStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'RELEASED',
  'REJECTED',
];

/**
 * Chip of each batch status, shared by the list, the indicators and the detail.
 *
 * @remarks
 * Open batches use the warning and information tones; the quality decision uses success or danger.
 */
export const BATCH_STATUS_CHIPS: Readonly<Record<BatchStatus, BatchStatusChipStyle>> = {
  PENDING: { tone: 'warning', icon: 'hourglass_top', labelKey: 'batches.status.pending' },
  IN_PROGRESS: { tone: 'info', icon: 'autorenew', labelKey: 'batches.status.in-progress' },
  RELEASED: { tone: 'success', icon: 'verified', labelKey: 'batches.status.released' },
  REJECTED: { tone: 'danger', icon: 'block', labelKey: 'batches.status.rejected' },
};

/**
 * Chip of a status the application does not know.
 */
export const UNKNOWN_BATCH_STATUS_CHIP: Readonly<BatchStatusChipStyle> = {
  tone: 'neutral',
  icon: 'help_outline',
  labelKey: 'batches.status.unknown',
};
