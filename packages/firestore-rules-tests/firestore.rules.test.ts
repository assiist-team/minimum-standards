import fs from 'fs';
import path from 'path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

const PROJECT_ID = 'minimum-standards-test';

function readRules(): string {
  const rulesPath = path.resolve(__dirname, '../../firebase/firestore.rules');
  return fs.readFileSync(rulesPath, 'utf8');
}

describe('Firestore security rules: user isolation', () => {
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

  test('denies unauthenticated read', async () => {
    const unauth = testEnv.unauthenticatedContext();
    const db = unauth.firestore();

    await assertFails(getDoc(doc(db, 'users/u1/activities/a1')));
  });

  test('denies cross-user read', async () => {
    const u1 = testEnv.authenticatedContext('u1');
    const u2 = testEnv.authenticatedContext('u2');

    const db1 = u1.firestore();
    const db2 = u2.firestore();

    await assertSucceeds(
      setDoc(doc(db1, 'users/u1/activities/a1'), {
        name: 'Sales Calls',
        unit: 'calls',
        inputType: 'number',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedAt: null
      })
    );

    await assertFails(getDoc(doc(db2, 'users/u1/activities/a1')));
  });

  test('allows authenticated user writes within their scope with server timestamps', async () => {
    const u1 = testEnv.authenticatedContext('u1');
    const db1 = u1.firestore();

    await assertSucceeds(
      setDoc(doc(db1, 'users/u1/standards/s1'), {
        activityId: 'a1',
        minimum: 100,
        unit: 'calls',
        cadence: 'weekly',
        state: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedAt: null
      })
    );
  });

  test('denies writes with unexpected fields', async () => {
    const u1 = testEnv.authenticatedContext('u1');
    const db1 = u1.firestore();

    await assertFails(
      setDoc(doc(db1, 'users/u1/activities/a1'), {
        name: 'Sales Calls',
        unit: 'calls',
        inputType: 'number',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedAt: null,
        ownerId: 'u1'
      })
    );
  });
});
