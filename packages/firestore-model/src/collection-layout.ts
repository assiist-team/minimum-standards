import { collection, CollectionReference, doc, Firestore } from 'firebase/firestore';

export type UserScopedCollections = {
  activities: CollectionReference;
  standards: CollectionReference;
  activityLogs: CollectionReference;
};

export function getUserScopedCollections(params: {
  // NOTE: Firestore's TS types are nominal (private fields) and can mismatch across
  // different Firebase bundles (e.g., when running under emulator test harnesses).
  // We accept `unknown` here and cast internally so this helper stays usable
  // anywhere a Firestore instance is provided at runtime.
  firestore: unknown;
  userId: string;
}): UserScopedCollections {
  const { userId } = params;
  const firestore = params.firestore as Firestore;
  const userDoc = doc(firestore, 'users', userId);

  return {
    activities: collection(userDoc, 'activities'),
    standards: collection(userDoc, 'standards'),
    activityLogs: collection(userDoc, 'activityLogs')
  };
}
