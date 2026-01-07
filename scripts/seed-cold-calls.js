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
const crypto = require('crypto');

// --- CONFIGURATION ---
const PROJECT_ID = 'minimum-standards';
const USER_ID = 'j2FBbuZWkbYDFj33pMrpJY75kH13';
const ACTIVITY_ID = 'SiEEv8F5n0Da9OES782c';
const STANDARD_ID = 'XrPWoeyYW2RQ2oqp4LkR';
const TIMEZONE = 'America/New_York'; // Adjust if needed

// Initialize Firebase Admin
admin.initializeApp({
  projectId: PROJECT_ID
});

const db = admin.firestore();

// --- PROGRESSION DATA (7 Weeks) ---
// Today is Tuesday, Jan 6, 2026.
// We'll define weeks relative to Jan 5, 2026 (the start of the current week).
const currentWeekStart = DateTime.fromISO('2026-01-05', { zone: TIMEZONE }).startOf('day');

const progression = [
  { week: 1, goal: 500,  logs: [{ d: 0, v: 200 }, { d: 2, v: 200 }, { d: 4, v: 100 }] },
  { week: 2, goal: 750,  logs: [{ d: 0, v: 250 }, { d: 1, v: 250 }, { d: 3, v: 250 }] },
  { week: 3, goal: 1000, logs: [{ d: 0, v: 300 }, { d: 1, v: 300 }, { d: 2, v: 300 }, { d: 3, v: 200 }] },
  { week: 4, goal: 1500, logs: [{ d: 0, v: 400 }, { d: 1, v: 400 }, { d: 2, v: 400 }, { d: 3, v: 300 }] },
  { week: 5, goal: 1750, logs: [{ d: 0, v: 500 }, { d: 1, v: 500 }, { d: 2, v: 500 }, { d: 3, v: 400 }] },
  { week: 6, goal: 2000, logs: [{ d: 0, v: 500 }, { d: 1, v: 500 }, { d: 2, v: 500 }, { d: 3, v: 500 }, { d: 4, v: 300 }] },
  { week: 7, goal: 2500, logs: [{ d: 0, v: 500 }, { d: 1, v: 500 }, { d: 2, v: 500 }, { d: 3, v: 500 }, { d: 4, v: 500 }] },
];

async function seed() {
  console.log('🚀 Starting seed for Cold Calls...');
  const batch = db.batch();
  
  const logsCollection = db.collection(`users/${USER_ID}/activityLogs`);
  const historyCollection = db.collection(`users/${USER_ID}/activityHistory`);

  for (const p of progression) {
    const weekIndex = p.week - 7; // -6 to 0
    const weekStart = currentWeekStart.plus({ weeks: weekIndex });
    const weekEnd = weekStart.plus({ weeks: 1 });
    
    console.log(`\nProcessing Week ${p.week} (${weekStart.toFormat('yyyy-MM-dd')}): Goal ${p.goal}`);

    let weekTotal = 0;

    // 1. Generate ActivityLog entries
    for (const log of p.logs) {
      const occurredAt = weekStart.plus({ days: log.d }).set({ hour: 10 });
      const logId = crypto.randomUUID();
      const logRef = logsCollection.doc(logId);
      
      const logData = {
        id: logId,
        standardId: STANDARD_ID,
        value: log.v,
        occurredAtMs: occurredAt.toMillis(),
        note: null,
        editedAtMs: null,
        deletedAtMs: null,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now()
      };
      
      batch.set(logRef, logData);
      weekTotal += log.v;
      console.log(`   - Log added: ${occurredAt.toFormat('EEE MM/dd')}: ${log.v} calls`);
    }

    // 2. Generate ActivityHistoryDoc (for weeks 1-6 only, week 7 is "In Progress")
    if (p.week < 7) {
      const periodStartMs = weekStart.toMillis();
      const docId = `${ACTIVITY_ID}__${STANDARD_ID}__${periodStartMs}`;
      const historyRef = historyCollection.doc(docId);

      const historyData = {
        id: docId,
        activityId: ACTIVITY_ID,
        standardId: STANDARD_ID,
        referenceTimestampMs: periodStartMs,
        periodStartMs: periodStartMs,
        periodEndMs: weekEnd.toMillis(),
        periodLabel: `${weekStart.toFormat('MM/dd/yyyy')} - ${weekEnd.minus({ days: 1 }).toFormat('MM/dd/yyyy')}`,
        periodKey: weekStart.toFormat('yyyy-LL-dd'),
        standardSnapshot: {
          minimum: p.goal,
          unit: 'calls',
          cadence: { interval: 1, unit: 'week' },
          sessionConfig: {
            sessionLabel: 'call',
            sessionsPerCadence: Math.ceil(p.goal / 50), // Mocked for visuals
            volumePerSession: 50
          },
          summary: `${p.goal} calls / week`
        },
        total: weekTotal,
        currentSessions: p.logs.length,
        targetSessions: Math.ceil(p.goal / 50),
        status: 'Met',
        progressPercent: 100,
        generatedAtMs: Date.now(),
        source: 'seed'
      };

      batch.set(historyRef, historyData);
      console.log(`   - History record created: ${docId}`);
    }
  }

  console.log('\nFinalizing... writing to Firestore.');
  await batch.commit();
  console.log('✅ Seed complete!');
}

seed().catch(err => {
  console.error('❌ Error seeding data:', err);
  process.exit(1);
});
