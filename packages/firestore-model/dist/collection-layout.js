"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserScopedCollections = getUserScopedCollections;
const firestore_1 = require("firebase/firestore");
function getUserScopedCollections(params) {
    const { userId } = params;
    const firestore = params.firestore;
    const userDoc = (0, firestore_1.doc)(firestore, 'users', userId);
    return {
        activities: (0, firestore_1.collection)(userDoc, 'activities'),
        standards: (0, firestore_1.collection)(userDoc, 'standards'),
        activityLogs: (0, firestore_1.collection)(userDoc, 'activityLogs')
    };
}
//# sourceMappingURL=collection-layout.js.map