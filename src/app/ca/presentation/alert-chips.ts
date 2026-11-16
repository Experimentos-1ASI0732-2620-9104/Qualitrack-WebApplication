import { StatusChipTone } from '../../shared/presentation/components/status-chip/status-chip';
import { AlertSeverity, AlertStatus } from '../domain/model/deviation-alert.entity';

/** What an `app-status-chip` needs to show a value of an alert. */
export interface AlertChip {
  tone: StatusChipTone;
  icon: string;
  labelKey: string;
}

/** Chip of each severity of an alert. */
export const ALERT_SEVERITY_CHIPS: Readonly<Record<AlertSeverity, AlertChip>> = {
  CRITICAL: { tone: 'danger', icon: 'error', labelKey: 'ca-alerts.severity.critical' },
  WARNING: { tone: 'warning', icon: 'warning', labelKey: 'ca-alerts.severity.warning' },
  LOW: { tone: 'neutral', icon: 'info', labelKey: 'ca-alerts.severity.low' },
};

/** Chip of each step of the life cycle of an alert. */
export const ALERT_STATUS_CHIPS: Readonly<Record<AlertStatus, AlertChip>> = {
  UNRESOLVED: {
    tone: 'outlined',
    icon: 'radio_button_unchecked',
    labelKey: 'ca-alerts.status.unresolved',
  },
  ACKNOWLEDGED: { tone: 'info', icon: 'pan_tool', labelKey: 'ca-alerts.status.acknowledged' },
  RESOLVED: { tone: 'success', icon: 'task_alt', labelKey: 'ca-alerts.status.resolved' },
};

/** Additional chip of an open alert whose condition already returned to normal. */
export const ALERT_NORMALIZED_CHIP: Readonly<AlertChip> = {
  tone: 'success',
  icon: 'check_circle',
  labelKey: 'ca-alerts.normalized',
};
