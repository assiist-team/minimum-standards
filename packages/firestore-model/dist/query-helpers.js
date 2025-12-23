"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whereNotDeleted = whereNotDeleted;
exports.orderByUpdatedAtDesc = orderByUpdatedAtDesc;
exports.orderByOccurredAtDesc = orderByOccurredAtDesc;
exports.whereStandardIdEquals = whereStandardIdEquals;
exports.whereStandardStateEquals = whereStandardStateEquals;
exports.whereActivityIdEquals = whereActivityIdEquals;
exports.orderByPeriodStartMsDesc = orderByPeriodStartMsDesc;
exports.orderByPeriodEndMsDesc = orderByPeriodEndMsDesc;
const firestore_1 = require("firebase/firestore");
function whereNotDeleted() {
    // Soft-delete convention: deletedAt == null means active.
    return (0, firestore_1.where)('deletedAt', '==', null);
}
function orderByUpdatedAtDesc() {
    return (0, firestore_1.orderBy)('updatedAt', 'desc');
}
function orderByOccurredAtDesc() {
    return (0, firestore_1.orderBy)('occurredAt', 'desc');
}
function whereStandardIdEquals(standardId) {
    return (0, firestore_1.where)('standardId', '==', standardId);
}
function whereStandardStateEquals(state) {
    return (0, firestore_1.where)('state', '==', state);
}
function whereActivityIdEquals(activityId) {
    return (0, firestore_1.where)('activityId', '==', activityId);
}
function orderByPeriodStartMsDesc() {
    return (0, firestore_1.orderBy)('periodStartMs', 'desc');
}
function orderByPeriodEndMsDesc() {
    return (0, firestore_1.orderBy)('periodEndMs', 'desc');
}
//# sourceMappingURL=query-helpers.js.map