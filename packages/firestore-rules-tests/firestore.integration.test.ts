import fs from 'fs';
import path from 'path';

import {
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';

import {
  collection,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

import {
  activityConverter,
  activityLogConverter,
  getUserScopedCollections,
  standardConverter,
  whereNotDeleted,
  whereStandardIdEquals,
  orderByOccurredAtDesc
} from '@minimum-standards/firestore-model';

import { Activity, ActivityLog, Standard } from '@minimum-standards/shared-model';

const PROJECT_ID = 'minimum-standards-test';

function readRules(): string {
  const rulesPath = path.resolve(__dirname, '../../firebase/firestore.rules');
  return fs.readFileSync(rulesPath, 'utf8');
}

describe('Integration: create/read with converters in user scope', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules: readRules() }
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('create Activity -> Standard -> ActivityLog then read back via converters', async () => {
    const u1 = testEnv.authenticatedContext('u1');
    const db = u1.firestore();

    const { activities, standards, activityLogs } = getUserScopedCollections({
      firestore: db,
      userId: 'u1',
      bindings: { collection, doc }
    });

    const activityRef = doc(activities, 'a1').withConverter(activityConverter);
    const standardRef = doc(standards, 's1').withConverter(standardConverter);
    const logRef = doc(activityLogs, 'l1').withConverter(activityLogConverter);

    const seedActivity: Activity = {
      id: 'a1',
      name: 'Sales Calls',
      unit: 'calls',
      createdAtMs: 1,
      updatedAtMs: 1,
      deletedAtMs: null
    };

    const seedStandard: Standard = {
      id: 's1',
      activityId: 'a1',
      minimum: 100,
      unit: 'calls',
      cadence: { interval: 1, unit: 'week' },
      state: 'active',
      summary: '100 calls / week',
      archivedAtMs: null,
      createdAtMs: 1,
      updatedAtMs: 1,
      deletedAtMs: null
    };

    const seedLog: ActivityLog = {
      id: 'l1',
      standardId: 's1',
      value: 14,
      occurredAtMs: 1234,
      note: null,
      editedAtMs: null,
      createdAtMs: 1,
      updatedAtMs: 1,
      deletedAtMs: null
    };

    // Writes through converters (createdAt/updatedAt use serverTimestamp())
    await assertSucceeds(setDoc(activityRef, seedActivity));
    await assertSucceeds(setDoc(standardRef, seedStandard));
    await assertSucceeds(setDoc(logRef, seedLog));

    const readLogSnap = await getDoc(logRef);
    expect(readLogSnap.exists()).toBe(true);
    const readLog = readLogSnap.data()!;
    expect(readLog.standardId).toBe('s1');
    expect(readLog.occurredAtMs).toBe(1234);

    // Soft-delete query helper sanity: non-deleted logs should match
    collection(db, 'users', 'u1', 'activityLogs').withConverter(activityLogConverter);
    const qConstraints = [whereStandardIdEquals('s1'), whereNotDeleted(), orderByOccurredAtDesc()];
    // We just verify we can construct constraints in integration context.
    expect(qConstraints).toHaveLength(3);
  });
});
