import type {
  CollectionReference,
  DocumentReference,
  Firestore
} from 'firebase/firestore';

export type CollectionFn = (
  reference: Firestore | DocumentReference,
  path: string,
  ...pathSegments: string[]
) => CollectionReference;

export type DocFn = (
  reference: Firestore | DocumentReference | CollectionReference,
  path: string,
  ...pathSegments: string[]
) => DocumentReference;

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

export function getUserScopedCollections(params: {
  firestore: unknown;
  userId: string;
  bindings: CollectionBindings;
}): UserScopedCollections {
  const { userId, bindings } = params;
  const firestore = params.firestore as Firestore;
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
