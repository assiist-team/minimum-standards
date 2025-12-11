export type TimestampMs = number;

export type ActivityInputType = 'number' | 'yes_no';

export type StandardCadence = 'daily' | 'weekly' | 'monthly';
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
    inputType: ActivityInputType;
  };

export type Standard = SoftDelete &
  AuditTimestamps & {
    id: string;
    activityId: string;
    minimum: number;
    unit: string;
    cadence: StandardCadence;
    state: StandardState;
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
