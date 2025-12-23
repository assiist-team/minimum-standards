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
export type ActivityHistorySource = 'boundary' | 'resume';
export type ActivityHistoryStandardSnapshot = {
    minimum: number;
    unit: string;
    cadence: StandardCadence;
    sessionConfig: StandardSessionConfig;
    summary?: string;
};
export type ActivityHistoryPeriodStatus = 'Met' | 'In Progress' | 'Missed';
export type ActivityHistoryDoc = {
    id: string;
    activityId: string;
    standardId: string;
    periodStartMs: TimestampMs;
    periodEndMs: TimestampMs;
    periodLabel: string;
    periodKey: string;
    standardSnapshot: ActivityHistoryStandardSnapshot;
    total: number;
    currentSessions: number;
    targetSessions: number;
    status: ActivityHistoryPeriodStatus;
    progressPercent: number;
    generatedAtMs: TimestampMs;
    source: ActivityHistorySource;
};
