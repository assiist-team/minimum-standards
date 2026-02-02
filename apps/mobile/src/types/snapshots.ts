import type {
  PeriodStartPreference,
  StandardCadence,
  StandardSessionConfig,
} from '@minimum-standards/shared-model';

export type SnapshotCategory = {
  id: string;
  name: string;
  order: number;
  isSystem?: boolean;
};

export type SnapshotActivity = {
  id: string;
  name: string;
  unit: string;
  notes: string | null;
  categoryId: string | null;
};

export type SnapshotStandard = {
  id: string;
  activityId: string;
  minimum: number;
  unit: string;
  cadence: StandardCadence;
  sessionConfig: StandardSessionConfig;
  periodStartPreference?: PeriodStartPreference;
};

export type SnapshotPayload = {
  categories: SnapshotCategory[];
  activities: SnapshotActivity[];
  standards: SnapshotStandard[];
};

export type SnapshotRecord = {
  id: string;
  ownerUserId: string;
  title: string;
  description: string | null;
  version: number;
  isEnabled: boolean;
  payload: SnapshotPayload;
  createdAtMs: number;
  updatedAtMs: number;
  deletedAtMs: number | null;
};

export type ShareLinkRecord = {
  id: string;
  shareCode: string;
  snapshotId: string;
  ownerUserId: string;
  createdAtMs: number;
  updatedAtMs: number;
  disabledAtMs: number | null;
};

export type SnapshotInstallRecord = {
  id: string;
  snapshotId: string;
  ownerUserId: string;
  installedAtMs: number;
};
