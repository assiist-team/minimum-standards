"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogConverter = exports.standardConverter = exports.activityConverter = void 0;
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
            inputType: model.inputType,
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
            inputType: data.inputType,
            createdAtMs: (0, timestamps_1.timestampToMs)(data.createdAt),
            updatedAtMs: (0, timestamps_1.timestampToMs)(data.updatedAt),
            deletedAtMs: data.deletedAt == null ? null : (0, timestamps_1.timestampToMs)(data.deletedAt)
        });
        return parsed;
    }
};
exports.standardConverter = {
    toFirestore(model) {
        return {
            activityId: model.activityId,
            minimum: model.minimum,
            unit: model.unit,
            cadence: model.cadence,
            state: model.state,
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
//# sourceMappingURL=converters.js.map