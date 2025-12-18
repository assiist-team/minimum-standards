export type TimestampMs = number;
export type CadenceUnit = 'day' | 'week' | 'month';
export type StandardCadence = {
    interval: number;
    unit: CadenceUnit;
};
export type StandardState = 'active' | 'archived';
export type StandardSessionConfig = {
    sessionLabel: string;
    sessionsPerCadence: number;
    volumePerSession: number;
};
export type SoftDelete = {
    deletedAtMs: TimestampMs | null;
};
export type AuditTimestamps = {
    createdAtMs: TimestampMs;
    updatedAtMs: TimestampMs;
};
export type Activity = SoftDelete & AuditTimestamps & {
    id: string;
    name: string;
    unit: string;
    notes: string | null;
};
export type Standard = SoftDelete & AuditTimestamps & {
    id: string;
    activityId: string;
    minimum: number;
    unit: string;
    cadence: StandardCadence;
    state: StandardState;
    summary: string;
    archivedAtMs: TimestampMs | null;
    quickAddValues?: number[];
    sessionConfig: StandardSessionConfig;
};
export type ActivityLog = SoftDelete & AuditTimestamps & {
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
