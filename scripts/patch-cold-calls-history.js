/**
 * Patch Cold Calls Activity History Snapshots
 *
 * After seeding logs (without history docs), run this script once the
 * Activity History engine has generated period rows. It rewrites each
 * completed week's `standardSnapshot.minimum` so the dummy data shows the
 * intended goal progression (500 ➝ 2,500).
 *
 * Usage:
 * 1. Ensure `node scripts/seed-cold-calls.js` has already run.
 * 2. Launch the app (or otherwise run `useActivityHistoryEngine`) so history docs exist.
 * 3. Run: node scripts/patch-cold-calls-history.js
 */

const admin = require('firebase-admin');

// --- CONFIGURATION ---
const PROJECT_ID = 'minimum-standards';
const USER_ID = 'j2FBbuZWkbYDFj33pMrpJY75kH13';
const ACTIVITY_ID = 'SiEEv8F5n0Da9OES782c';
const STANDARD_ID = 'rVg8h3suMAZEhpPOg4tP';

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: PROJECT_ID,
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function getStandardMetadata() {
  const standardRef = db.doc(`users/${USER_ID}/standards/${STANDARD_ID}`);
  const snapshot = await standardRef.get();
  if (!snapshot.exists) {
    throw new Error(`Standard ${STANDARD_ID} not found for user ${USER_ID}`);
  }
  const data = snapshot.data() || {};
  return {
    unit: data.unit || 'calls',
    cadence: data.cadence || { interval: 1, unit: 'week' },
    sessionConfig: data.sessionConfig || {
      sessionLabel: 'call',
      sessionsPerCadence: 35,
      volumePerSession: 50,
    },
    summary:
      data.summary ||
      `${data.minimum ?? 0} ${data.unit || 'calls'} / ${data?.cadence?.unit || 'week'}`,
    periodStartPreference: data.periodStartPreference || null,
  };
}

const progression = [
  { week: 1, goal: 500 },
  { week: 2, goal: 750 },
  { week: 3, goal: 1000 },
  { week: 4, goal: 1500 },
  { week: 5, goal: 1750 },
  { week: 6, goal: 2000 },
  { week: 7, goal: 2500 },
];

async function patchHistorySnapshots() {
  console.log('🩹 Patching Cold Calls history snapshots...');
  const historyCollection = db.collection(`users/${USER_ID}/activityHistory`);
  const standardMeta = await getStandardMetadata();

  const snapshot = await historyCollection
    .where('activityId', '==', ACTIVITY_ID)
    .where('standardId', '==', STANDARD_ID)
    .get();

  if (snapshot.empty) {
    console.warn('⚠️ No activity history documents found for Cold Calls.');
    return;
  }

  const docs = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() || {};
      const reference =
        typeof data.referenceTimestampMs === 'number'
          ? data.referenceTimestampMs
          : typeof data.periodStartMs === 'number'
            ? data.periodStartMs
            : Number.POSITIVE_INFINITY;
      return { docSnap, data, reference };
    })
    .filter((entry) => Number.isFinite(entry.reference))
    .sort((a, b) => a.reference - b.reference);

  // Only patch completed periods (skip the latest in-progress one)
  const docsToPatch = docs.filter((entry) => entry.data.status !== 'In Progress');
  const maxWeeksToPatch = progression.length - 1; // final week is current period

  let patchedCount = 0;
  for (let i = 0; i < docsToPatch.length && i < maxWeeksToPatch; i++) {
    const goal = progression[i].goal;
    const { docSnap, data } = docsToPatch[i];
    const existingSnapshot = data.standardSnapshot || {};
    const patchedSnapshot = {
      ...existingSnapshot,
      minimum: goal,
      summary: `${goal} ${existingSnapshot.unit || standardMeta.unit} / ${
        existingSnapshot.cadence?.unit || standardMeta.cadence.unit
      }`,
    };

    await docSnap.ref.update({ standardSnapshot: patchedSnapshot });
    patchedCount += 1;
    console.log(`   ✅ Patched ${docSnap.id}: minimum ${goal}`);
  }

  console.log(`\nDone. Patched ${patchedCount} history snapshots.`);
}

patchHistorySnapshots().catch((err) => {
  console.error('❌ Error patching history snapshots:', err);
  process.exit(1);
});
