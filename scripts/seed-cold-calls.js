/**
 * Seed Cold Calls Dummy Data
 * 
 * This script generates 7 weeks of "Cold calls" activity logs and history snapshots.
 * It follows a progression from 500 to 2,500 calls per week.
 * 
 * Usage:
 * 1. Install dependencies: npm install firebase-admin luxon
 * 2. Set your service account: export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account.json"
 * 3. Run: node scripts/seed-cold-calls.js
 */

const admin = require('firebase-admin');
const { DateTime } = require('luxon');

// --- CONFIGURATION ---
const PROJECT_ID = 'minimum-standards';
const USER_ID = 'j2FBbuZWkbYDFj33pMrpJY75kH13';
const ACTIVITY_ID = 'SiEEv8F5n0Da9OES782c';
const STANDARD_ID = 'rVg8h3suMAZEhpPOg4tP';
const TIMEZONE = 'America/New_York';

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
  if (
    !data.sessionConfig ||
    typeof data.sessionConfig.volumePerSession !== 'number' ||
    data.sessionConfig.volumePerSession <= 0
  ) {
    console.warn(
      `⚠️ Standard ${STANDARD_ID} missing volumePerSession; defaulting to 50`
    );
    data.sessionConfig = {
      sessionLabel: data.sessionConfig?.sessionLabel || 'call',
      sessionsPerCadence: data.sessionConfig?.sessionsPerCadence || 35,
      volumePerSession: 50,
    };
  }
  return {
    unit: data.unit || 'calls',
    cadence: data.cadence || { interval: 1, unit: 'week' },
    sessionConfig: data.sessionConfig,
    summary:
      data.summary ||
      `${data.minimum ?? 0} ${data.unit || 'calls'} / ${data?.cadence?.unit || 'week'}`,
    periodStartPreference: data.periodStartPreference || null,
  };
}

// --- PROGRESSION DATA (7 Weeks) ---
const progression = [
  { week: 1, goal: 500,  logs: [{ d: 0, v: 200 }, { d: 2, v: 200 }, { d: 4, v: 100 }] },
  { week: 2, goal: 750,  logs: [{ d: 0, v: 250 }, { d: 1, v: 250 }, { d: 3, v: 250 }] },
  { week: 3, goal: 1000, logs: [{ d: 0, v: 300 }, { d: 1, v: 300 }, { d: 2, v: 300 }, { d: 3, v: 200 }] },
  { week: 4, goal: 1500, logs: [{ d: 0, v: 400 }, { d: 1, v: 400 }, { d: 2, v: 400 }, { d: 3, v: 300 }] },
  { week: 5, goal: 1750, logs: [{ d: 0, v: 500 }, { d: 1, v: 500 }, { d: 2, v: 500 }, { d: 3, v: 400 }] },
  { week: 6, goal: 2000, logs: [{ d: 0, v: 500 }, { d: 1, v: 500 }, { d: 2, v: 500 }, { d: 3, v: 500 }, { d: 4, v: 300 }] },
  { week: 7, goal: 2500, logs: [{ d: 0, v: 500 }, { d: 1, v: 500 }, { d: 2, v: 500 }, { d: 3, v: 500 }, { d: 4, v: 500 }] },
];

function getCurrentWeekStart() {
  const now = DateTime.now().setZone(TIMEZONE);
  let monday = now.startOf('day').set({ weekday: 1 });
  if (monday > now) {
    monday = monday.minus({ weeks: 1 });
  }
  return monday;
}

function buildLogId(weekStart, logIndex) {
  return [
    'seed',
    STANDARD_ID,
    weekStart.toFormat('yyyyLLdd'),
    logIndex,
  ].join('-');
}

async function cleanupLegacyLogs(logsCollection) {
  console.log('🔍 Checking for legacy cold-call logs without occurredAt...');
  const snapshot = await logsCollection.where('standardId', '==', STANDARD_ID).get();
  const legacyDocs = snapshot.docs.filter((doc) => !doc.get('occurredAt'));

  if (legacyDocs.length === 0) {
    console.log('   No legacy logs to remove.');
    return;
  }

  console.log(`   Found ${legacyDocs.length} legacy logs -> deleting...`);
  const chunkSize = 400;
  for (let i = 0; i < legacyDocs.length; i += chunkSize) {
    const chunk = legacyDocs.slice(i, i + chunkSize);
    const batch = db.batch();
    chunk.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
  }
  console.log('   Legacy cleanup finished.');
}

async function deleteQueryInChunks(queryRef, label) {
  console.log(`🔁 Checking for existing ${label}...`);
  const snapshot = await queryRef.get();
  if (snapshot.empty) {
    console.log(`   No ${label} found.`);
    return;
  }

  console.log(`   Found ${snapshot.size} ${label} -> deleting...`);
  const chunkSize = 400;
  for (let i = 0; i < snapshot.docs.length; i += chunkSize) {
    const chunk = snapshot.docs.slice(i, i + chunkSize);
    const batch = db.batch();
    chunk.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
  }
  console.log(`   Removed ${snapshot.size} ${label}.`);
}

async function purgeExistingSeedData(logsCollection, historyCollection) {
  console.log('🧹 Purging existing cold-call seed logs...');
  await deleteQueryInChunks(
    logsCollection.where('standardId', '==', STANDARD_ID),
    'activity logs'
  );
  console.log('🧼 Purging existing cold-call history rows...');
  await deleteQueryInChunks(
    historyCollection.where('activityId', '==', ACTIVITY_ID),
    'activity history rows'
  );
}

async function seed() {
  console.log('🚀 Starting seed for Cold Calls...');
  const logsCollection = db.collection(`users/${USER_ID}/activityLogs`);
  const historyCollection = db.collection(`users/${USER_ID}/activityHistory`);

  await cleanupLegacyLogs(logsCollection);
  await purgeExistingSeedData(logsCollection, historyCollection);
  const standardMeta = await getStandardMetadata();

  const batch = db.batch();
  const currentWeekStart = getCurrentWeekStart();
  const totalWeeks = progression.length;
  const seedRunTimestamp = Date.now();
  for (const p of progression) {
    const weeksFromCurrent = p.week - totalWeeks; // Week 7 => 0, Week 1 => -6
    const weekStart = currentWeekStart.plus({ weeks: weeksFromCurrent });
    const weekEnd = weekStart.plus({ weeks: 1 });

    console.log(`\nProcessing Week ${p.week} (${weekStart.toFormat('yyyy-MM-dd')}): Goal ${p.goal}`);

    let weekTotal = 0;

    p.logs.forEach((log, logIdx) => {
      const occurredAt = weekStart.plus({ days: log.d }).set({
        hour: 10,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      const logId = buildLogId(weekStart, logIdx);
      const logRef = logsCollection.doc(logId);

      const logData = {
        standardId: STANDARD_ID,
        value: log.v,
        occurredAt: admin.firestore.Timestamp.fromMillis(occurredAt.toMillis()),
        note: null,
        editedAt: null,
        deletedAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      batch.set(logRef, logData);
      weekTotal += log.v;
      console.log(`   - Log added: ${occurredAt.toFormat('EEE MM/dd')}: ${log.v} calls`);
    });

  }

  console.log('\nℹ️ History rows are no longer seeded manually.');
  console.log(
    '   Launch the app (or run the Activity History engine) to regenerate periods from these logs.'
  );

  console.log('\nFinalizing... writing to Firestore.');
  await batch.commit();
  console.log('✅ Seed complete!');
}

seed().catch((err) => {
  console.error('❌ Error seeding data:', err);
  process.exit(1);
});
