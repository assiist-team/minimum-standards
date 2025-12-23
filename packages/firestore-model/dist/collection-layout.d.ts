import type { CollectionReference, DocumentReference, Firestore } from 'firebase/firestore';
export type CollectionFn = (reference: Firestore | DocumentReference, path: string, ...pathSegments: string[]) => CollectionReference;
export type DocFn = (reference: Firestore | DocumentReference | CollectionReference, path: string, ...pathSegments: string[]) => DocumentReference;
export type CollectionBindings = {
    collection: CollectionFn;
    doc: DocFn;
};
export type UserScopedCollections = {
    activities: CollectionReference;
    standards: CollectionReference;
    activityLogs: CollectionReference;
    activityHistory: CollectionReference;
    dashboardPins: DocumentReference;
};
export declare function getUserScopedCollections(params: {
    firestore: unknown;
    userId: string;
    bindings: CollectionBindings;
}): UserScopedCollections;
