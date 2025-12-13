export type TimestampMs = number;

export type CadenceUnit = 'day' | 'week' | 'month';
export type StandardCadence = {
  interval: number;
  unit: CadenceUnit;
};
export type StandardState = 'active' | 'archived';

export type SoftDelete = {
  deletedAtMs: TimestampMs | null;
};

export type AuditTimestamps = {
  createdAtMs: TimestampMs;
  updatedAtMs: TimestampMs;
};

export type Activity = SoftDelete &
  AuditTimestamps & {
    id: string;
    name: string;
    unit: string;
  };

export type Standard = SoftDelete &
  AuditTimestamps & {
    id: string;
    activityId: string;
    minimum: number;
    unit: string;
    cadence: StandardCadence;
    state: StandardState;
    summary: string; // Normalized summary string like "1000 calls / week"
    archivedAtMs: TimestampMs | null; // Timestamp when archived, null if active
    quickAddValues?: number[]; // Optional preset chips for fast logging (e.g., [1])
  };

export type ActivityLog = SoftDelete &
  AuditTimestamps & {
    id: string;
    standardId: string;
    value: number;
    occurredAtMs: TimestampMs;
    note: string | null;
    editedAtMs: TimestampMs | null;
  };

export type DashboardPins = {
  id: string;
  pinnedStandardIds: string[];
  updatedAtMs: TimestampMs;
};
