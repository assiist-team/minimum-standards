import { CollectionReference, DocumentReference } from 'firebase/firestore';
export type UserScopedCollections = {
    activities: CollectionReference;
    standards: CollectionReference;
    activityLogs: CollectionReference;
    dashboardPins: DocumentReference;
};
export declare function getUserScopedCollections(params: {
    firestore: unknown;
    userId: string;
}): UserScopedCollections;
