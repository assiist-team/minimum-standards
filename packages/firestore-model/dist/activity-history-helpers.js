"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildActivityHistoryDocId = buildActivityHistoryDocId;
exports.createActivityHistoryHelpers = createActivityHistoryHelpers;
const collection_layout_1 = require("./collection-layout");
/**
 * Builds a deterministic document ID for activityHistory documents.
 * Format: activityId__standardId__periodStartMs
 */
function buildActivityHistoryDocId(activityId, standardId, periodStartMs) {
    return `${activityId}__${standardId}__${periodStartMs}`;
}
function toActivityHistoryDoc(docId, data) {
    if (!data ||
        typeof data.activityId !== 'string' ||
        typeof data.standardId !== 'string' ||
        typeof data.periodStartMs !== 'number' ||
        typeof data.periodEndMs !== 'number' ||
        typeof data.periodLabel !== 'string' ||
        !data.standardSnapshot ||
        typeof data.total !== 'number' ||
        typeof data.currentSessions !== 'number' ||
        typeof data.targetSessions !== 'number' ||
        typeof data.status !== 'string' ||
        typeof data.progressPercent !== 'number') {
        return null;
    }
    return {
        id: docId,
        activityId: data.activityId,
        standardId: data.standardId,
        periodStartMs: data.periodStartMs,
        periodEndMs: data.periodEndMs,
        periodLabel: data.periodLabel,
        periodKey: data.periodKey ?? '',
        standardSnapshot: data.standardSnapshot,
        total: data.total,
        currentSessions: data.currentSessions,
        targetSessions: data.targetSessions,
        status: data.status,
        progressPercent: data.progressPercent,
        generatedAtMs: data.generatedAtMs ?? Date.now(),
        source: data.source ?? 'boundary',
    };
}
function createActivityHistoryHelpers(bindings) {
    const { collection, doc, query, where, orderBy, limit, getDocs, setDoc, onSnapshot, } = bindings;
    async function writeActivityHistoryPeriod(params) {
        const { firestore, userId, activityId, standardId, window, standardSnapshot, rollup, source, } = params;
        const collections = (0, collection_layout_1.getUserScopedCollections)({
            firestore,
            userId,
            bindings: { collection, doc },
        });
        const docId = buildActivityHistoryDocId(activityId, standardId, window.startMs);
        const docRef = doc(collections.activityHistory, docId);
        const payload = {
            id: docId,
            activityId,
            standardId,
            periodStartMs: window.startMs,
            periodEndMs: window.endMs,
            periodLabel: window.label,
            periodKey: window.periodKey ?? '',
            standardSnapshot,
            total: rollup.total,
            currentSessions: rollup.currentSessions,
            targetSessions: rollup.targetSessions,
            status: rollup.status,
            progressPercent: rollup.progressPercent,
            generatedAtMs: Date.now(),
            source,
        };
        await setDoc(docRef, payload, { merge: true });
    }
    async function getLatestHistoryForStandard(params) {
        // Runtime validation to catch stale bundle issues early
        // If params is not an object or missing required fields, this indicates a stale bundle
        // or incorrect call signature (positional instead of object parameter)
        if (!params || typeof params !== 'object' || Array.isArray(params)) {
            throw new Error('[getLatestHistoryForStandard] Invalid parameter: expected object with { firestore, userId, standardId }. ' +
                'This error usually indicates a stale JS bundle. ' +
                'See troubleshooting/activity-history-engine-call-error.md for resolution steps.');
        }
        const { firestore, userId, standardId } = params;
        if (!firestore) {
            throw new Error('[getLatestHistoryForStandard] firestore is required but was undefined. ' +
                'This usually indicates a stale JS bundle calling the function with positional arguments. ' +
                'See troubleshooting/activity-history-engine-call-error.md for resolution steps.');
        }
        if (!userId || typeof userId !== 'string') {
            throw new Error(`[getLatestHistoryForStandard] userId is required and must be a string, got: ${typeof userId}. ` +
                'This may indicate a stale bundle. See troubleshooting/activity-history-engine-call-error.md');
        }
        if (!standardId || typeof standardId !== 'string') {
            throw new Error(`[getLatestHistoryForStandard] standardId is required and must be a string, got: ${typeof standardId}. ` +
                'This may indicate a stale bundle. See troubleshooting/activity-history-engine-call-error.md');
        }
        const collections = (0, collection_layout_1.getUserScopedCollections)({
            firestore,
            userId,
            bindings: { collection, doc },
        });
        const historyQuery = query(collections.activityHistory, where('standardId', '==', standardId), orderBy('periodStartMs', 'desc'), limit(1));
        const snapshot = await getDocs(historyQuery);
        if (snapshot.empty) {
            return null;
        }
        const raw = snapshot.docs[0].data();
        return toActivityHistoryDoc(snapshot.docs[0].id, raw);
    }
    function listenActivityHistoryForActivity(params) {
        const { firestore, userId, activityId, onNext, onError } = params;
        const collections = (0, collection_layout_1.getUserScopedCollections)({
            firestore,
            userId,
            bindings: { collection, doc },
        });
        const historyQuery = query(collections.activityHistory, where('activityId', '==', activityId), orderBy('periodEndMs', 'desc'));
        return onSnapshot(historyQuery, (snapshot) => {
            const docs = [];
            snapshot.forEach((docSnap) => {
                const parsed = toActivityHistoryDoc(docSnap.id, docSnap.data());
                if (parsed) {
                    docs.push(parsed);
                }
            });
            onNext(docs);
        }, (error) => {
            if (onError) {
                onError(error);
            }
        });
    }
    return {
        writeActivityHistoryPeriod,
        getLatestHistoryForStandard,
        listenActivityHistoryForActivity,
    };
}
//# sourceMappingURL=activity-history-helpers.js.map