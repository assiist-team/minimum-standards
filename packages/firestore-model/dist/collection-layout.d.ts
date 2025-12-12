import { CollectionReference } from 'firebase/firestore';
export type UserScopedCollections = {
    activities: CollectionReference;
    standards: CollectionReference;
    activityLogs: CollectionReference;
};
export declare function getUserScopedCollections(params: {
    firestore: unknown;
    userId: string;
}): UserScopedCollections;
