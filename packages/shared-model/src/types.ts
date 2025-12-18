export type TimestampMs = number;

export type CadenceUnit = 'day' | 'week' | 'month';
export type StandardCadence = {
  interval: number;
  unit: CadenceUnit;
};
export type StandardState = 'active' | 'archived';

export type StandardSessionConfig = {
  sessionLabel: string; // User-friendly label for the "count" dimension (e.g., "session", "run", "workout")
  sessionsPerCadence: number; // e.g., 5 sessions per week
  volumePerSession: number; // e.g., 15 minutes per session
};

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
    notes: string | null;
  };

export type Standard = SoftDelete &
  AuditTimestamps & {
    id: string;
    activityId: string;
    minimum: number; // Always calculated from sessionConfig: sessionsPerCadence × volumePerSession
    unit: string;
    cadence: StandardCadence;
    state: StandardState;
    summary: string; // Normalized summary string like "1000 calls / week" or "5 sessions × 15 minutes = 75 minutes / week"
    archivedAtMs: TimestampMs | null; // Timestamp when archived, null if active
    quickAddValues?: number[]; // Optional preset chips for fast logging (e.g., [1])
    sessionConfig: StandardSessionConfig; // Required: session-based configuration
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
