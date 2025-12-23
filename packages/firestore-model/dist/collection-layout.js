"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserScopedCollections = getUserScopedCollections;
function getUserScopedCollections(params) {
    const { userId, bindings } = params;
    const firestore = params.firestore;
    const userDoc = bindings.doc(firestore, 'users', userId);
    const activities = bindings.collection(userDoc, 'activities');
    const standards = bindings.collection(userDoc, 'standards');
    const activityLogs = bindings.collection(userDoc, 'activityLogs');
    const activityHistory = bindings.collection(userDoc, 'activityHistory');
    const preferences = bindings.collection(userDoc, 'preferences');
    const dashboardPins = bindings.doc(preferences, 'dashboardPins');
    return {
        activities,
        standards,
        activityLogs,
        activityHistory,
        dashboardPins,
    };
}
//# sourceMappingURL=collection-layout.js.map