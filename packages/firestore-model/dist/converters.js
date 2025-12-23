"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityHistoryConverter = exports.dashboardPinsConverter = exports.activityLogConverter = exports.standardConverter = exports.activityConverter = void 0;
const firestore_1 = require("firebase/firestore");
const shared_model_1 = require("@minimum-standards/shared-model");
const timestamps_1 = require("./timestamps");
function parseWith(schema, value) {
    return schema.parse(value);
}
exports.activityConverter = {
    toFirestore(model) {
        // Note: createdAt/updatedAt should be server-controlled; on write we use serverTimestamp().
        // Note: unit should already be normalized to plural form via activitySchema transform.
        return {
            name: model.name,
            unit: model.unit, // Already normalized via schema transform
            notes: model.notes,
            createdAt: (0, firestore_1.serverTimestamp)(),
            updatedAt: (0, firestore_1.serverTimestamp)(),
            deletedAt: model.deletedAtMs == null ? null : (0, timestamps_1.msToTimestamp)(model.deletedAtMs)
        };
    },
    fromFirestore(snapshot, options) {
        const data = snapshot.data(options);
        const parsed = parseWith(shared_model_1.activitySchema, {
            id: snapshot.id,
            name: data.name,
            unit: data.unit,
            notes: data.notes ?? null,
            createdAtMs: (0, timestamps_1.timestampToMs)(data.createdAt),
            updatedAtMs: (0, timestamps_1.timestampToMs)(data.updatedAt),
            deletedAtMs: data.deletedAt == null ? null : (0, timestamps_1.timestampToMs)(data.deletedAt)
        });
        return {
            ...parsed,
            notes: parsed.notes ?? null,
        };
    }
};
exports.standardConverter = {
    toFirestore(model) {
        // Ensure summary is regenerated if cadence/minimum/unit/sessionConfig changed
        const summary = (0, shared_model_1.formatStandardSummary)(model.minimum, model.unit, model.cadence, model.sessionConfig);
        return {
            activityId: model.activityId,
            minimum: model.minimum,
            unit: model.unit,
            cadence: model.cadence,
            state: model.state,
            summary: summary,
            sessionConfig: model.sessionConfig,
            ...(Array.isArray(model.quickAddValues) && model.quickAddValues.length > 0
                ? { quickAddValues: model.quickAddValues }
                : {}),
            archivedAt: model.archivedAtMs == null ? null : (0, timestamps_1.msToTimestamp)(model.archivedAtMs),
            createdAt: (0, firestore_1.serverTimestamp)(),
            updatedAt: (0, firestore_1.serverTimestamp)(),
            deletedAt: model.deletedAtMs == null ? null : (0, timestamps_1.msToTimestamp)(model.deletedAtMs)
        };
    },
    fromFirestore(snapshot, options) {
        const data = snapshot.data(options);
        return parseWith(shared_model_1.standardSchema, {
            id: snapshot.id,
            activityId: data.activityId,
            minimum: data.minimum,
            unit: data.unit,
            cadence: data.cadence,
            state: data.state,
            summary: data.summary,
            sessionConfig: data.sessionConfig,
            quickAddValues: Array.isArray(data.quickAddValues)
                ? data.quickAddValues.filter((value) => typeof value === 'number' && Number.isFinite(value) && value > 0)
                : undefined,
            archivedAtMs: data.archivedAt == null ? null : (0, timestamps_1.timestampToMs)(data.archivedAt),
            createdAtMs: (0, timestamps_1.timestampToMs)(data.createdAt),
            updatedAtMs: (0, timestamps_1.timestampToMs)(data.updatedAt),
            deletedAtMs: data.deletedAt == null ? null : (0, timestamps_1.timestampToMs)(data.deletedAt)
        });
    }
};
exports.activityLogConverter = {
    toFirestore(model) {
        return {
            standardId: model.standardId,
            value: model.value,
            occurredAt: (0, timestamps_1.msToTimestamp)(model.occurredAtMs),
            note: model.note,
            editedAt: model.editedAtMs == null ? null : (0, timestamps_1.msToTimestamp)(model.editedAtMs),
            createdAt: (0, firestore_1.serverTimestamp)(),
            updatedAt: (0, firestore_1.serverTimestamp)(),
            deletedAt: model.deletedAtMs == null ? null : (0, timestamps_1.msToTimestamp)(model.deletedAtMs)
        };
    },
    fromFirestore(snapshot, options) {
        const data = snapshot.data(options);
        return parseWith(shared_model_1.activityLogSchema, {
            id: snapshot.id,
            standardId: data.standardId,
            value: data.value,
            occurredAtMs: (0, timestamps_1.timestampToMs)(data.occurredAt),
            note: data.note ?? null,
            editedAtMs: data.editedAt == null ? null : (0, timestamps_1.timestampToMs)(data.editedAt),
            createdAtMs: (0, timestamps_1.timestampToMs)(data.createdAt),
            updatedAtMs: (0, timestamps_1.timestampToMs)(data.updatedAt),
            deletedAtMs: data.deletedAt == null ? null : (0, timestamps_1.timestampToMs)(data.deletedAt)
        });
    }
};
exports.dashboardPinsConverter = {
    toFirestore(model) {
        return {
            pinnedStandardIds: model.pinnedStandardIds,
            updatedAt: (0, firestore_1.serverTimestamp)()
        };
    },
    fromFirestore(snapshot, options) {
        const data = snapshot.data(options);
        return parseWith(shared_model_1.dashboardPinsSchema, {
            id: snapshot.id,
            pinnedStandardIds: Array.isArray(data.pinnedStandardIds)
                ? data.pinnedStandardIds
                : [],
            updatedAtMs: data.updatedAt == null ? Date.now() : (0, timestamps_1.timestampToMs)(data.updatedAt)
        });
    }
};
exports.activityHistoryConverter = {
    toFirestore(model) {
        // Note: All timestamps are stored as numbers (ms) per spec
        return {
            activityId: model.activityId,
            standardId: model.standardId,
            periodStartMs: model.periodStartMs,
            periodEndMs: model.periodEndMs,
            periodLabel: model.periodLabel,
            periodKey: model.periodKey,
            standardSnapshot: model.standardSnapshot,
            total: model.total,
            currentSessions: model.currentSessions,
            targetSessions: model.targetSessions,
            status: model.status,
            progressPercent: model.progressPercent,
            generatedAtMs: model.generatedAtMs,
            source: model.source,
        };
    },
    fromFirestore(snapshot, options) {
        const data = snapshot.data(options);
        return parseWith(shared_model_1.activityHistoryDocSchema, {
            id: snapshot.id,
            activityId: data.activityId,
            standardId: data.standardId,
            periodStartMs: data.periodStartMs,
            periodEndMs: data.periodEndMs,
            periodLabel: data.periodLabel,
            periodKey: data.periodKey,
            standardSnapshot: data.standardSnapshot,
            total: data.total,
            currentSessions: data.currentSessions,
            targetSessions: data.targetSessions,
            status: data.status,
            progressPercent: data.progressPercent,
            generatedAtMs: data.generatedAtMs,
            source: data.source,
        });
    }
};
//# sourceMappingURL=converters.js.map