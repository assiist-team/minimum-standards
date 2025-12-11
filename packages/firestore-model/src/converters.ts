import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';
import {
  Activity,
  ActivityLog,
  Standard,
  activityLogSchema,
  activitySchema,
  standardSchema
} from '@minimum-standards/shared-model';
import { msToTimestamp, timestampToMs } from './timestamps';

type FirestoreActivity = Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
};

type FirestoreStandard = Omit<Standard, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
};

type FirestoreActivityLog = Omit<
  ActivityLog,
  'id' | 'createdAtMs' | 'updatedAtMs' | 'editedAtMs' | 'deletedAtMs' | 'occurredAtMs'
> & {
  occurredAt: Timestamp;
  note: string | null;
  editedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
};

function parseWith<T>(schema: z.ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

export const activityConverter: FirestoreDataConverter<Activity> = {
  toFirestore(model: Activity) {
    // Note: createdAt/updatedAt should be server-controlled; on write we use serverTimestamp().
    return {
      name: model.name,
      unit: model.unit,
      inputType: model.inputType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: model.deletedAtMs == null ? null : msToTimestamp(model.deletedAtMs)
    } as unknown as FirestoreActivity;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Activity {
    const data = snapshot.data(options) as FirestoreActivity;

    const parsed = parseWith(activitySchema, {
      id: snapshot.id,
      name: data.name,
      unit: data.unit,
      inputType: data.inputType,
      createdAtMs: timestampToMs(data.createdAt),
      updatedAtMs: timestampToMs(data.updatedAt),
      deletedAtMs: data.deletedAt == null ? null : timestampToMs(data.deletedAt)
    });

    return parsed;
  }
};

export const standardConverter: FirestoreDataConverter<Standard> = {
  toFirestore(model: Standard) {
    return {
      activityId: model.activityId,
      minimum: model.minimum,
      unit: model.unit,
      cadence: model.cadence,
      state: model.state,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: model.deletedAtMs == null ? null : msToTimestamp(model.deletedAtMs)
    } as unknown as FirestoreStandard;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Standard {
    const data = snapshot.data(options) as FirestoreStandard;

    return parseWith(standardSchema, {
      id: snapshot.id,
      activityId: data.activityId,
      minimum: data.minimum,
      unit: data.unit,
      cadence: data.cadence,
      state: data.state,
      createdAtMs: timestampToMs(data.createdAt),
      updatedAtMs: timestampToMs(data.updatedAt),
      deletedAtMs: data.deletedAt == null ? null : timestampToMs(data.deletedAt)
    });
  }
};

export const activityLogConverter: FirestoreDataConverter<ActivityLog> = {
  toFirestore(model: ActivityLog) {
    return {
      standardId: model.standardId,
      value: model.value,
      occurredAt: msToTimestamp(model.occurredAtMs),
      note: model.note,
      editedAt: model.editedAtMs == null ? null : msToTimestamp(model.editedAtMs),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: model.deletedAtMs == null ? null : msToTimestamp(model.deletedAtMs)
    } as unknown as FirestoreActivityLog;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): ActivityLog {
    const data = snapshot.data(options) as FirestoreActivityLog;

    return parseWith(activityLogSchema, {
      id: snapshot.id,
      standardId: data.standardId,
      value: data.value,
      occurredAtMs: timestampToMs(data.occurredAt),
      note: data.note ?? null,
      editedAtMs: data.editedAt == null ? null : timestampToMs(data.editedAt),
      createdAtMs: timestampToMs(data.createdAt),
      updatedAtMs: timestampToMs(data.updatedAt),
      deletedAtMs: data.deletedAt == null ? null : timestampToMs(data.deletedAt)
    });
  }
};
