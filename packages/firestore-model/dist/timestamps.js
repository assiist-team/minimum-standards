"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timestampToMs = timestampToMs;
exports.msToTimestamp = msToTimestamp;
const firestore_1 = require("firebase/firestore");
function timestampToMs(value) {
    if (value instanceof firestore_1.Timestamp)
        return value.toMillis();
    if (value instanceof Date)
        return value.getTime();
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    throw new Error('Unsupported timestamp value');
}
function msToTimestamp(value) {
    return firestore_1.Timestamp.fromMillis(value);
}
//# sourceMappingURL=timestamps.js.map