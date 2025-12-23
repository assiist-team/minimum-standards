import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { ActivityHistoryDoc } from '@minimum-standards/shared-model';
import {
  ActivityHistoryFirestoreBindings,
  GetLatestHistoryForStandardParams,
  ListenActivityHistoryForActivityParams,
  WriteActivityHistoryPeriodParams,
  createActivityHistoryHelpers,
} from '@minimum-standards/firestore-model';
import { firebaseFirestore } from '../firebase/firebaseApp';

const reactNativeBindings: ActivityHistoryFirestoreBindings = {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  setDoc: (
    reference: FirebaseFirestoreTypes.DocumentReference,
    data: ActivityHistoryDoc,
    options?: { merge?: boolean }
  ) => reference.set(data, options),
};

const {
  writeActivityHistoryPeriod: writeActivityHistoryPeriodInternal,
  getLatestHistoryForStandard: getLatestHistoryForStandardInternal,
  listenActivityHistoryForActivity: listenActivityHistoryForActivityInternal,
} = createActivityHistoryHelpers(reactNativeBindings);

export function writeActivityHistoryPeriod(
  params: Omit<WriteActivityHistoryPeriodParams, 'firestore'>
) {
  return writeActivityHistoryPeriodInternal({
    ...params,
    firestore: firebaseFirestore,
  });
}

export function getLatestHistoryForStandard(
  params: Omit<GetLatestHistoryForStandardParams, 'firestore'>
) {
  // Validate params before calling internal function
  // This catches issues early and provides better error messages
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error(
      '[getLatestHistoryForStandard] Expected object parameter with { userId, standardId }. ' +
      'If you see this, you may have a stale bundle. ' +
      'See troubleshooting/activity-history-engine-call-error.md for resolution.'
    );
  }

  if (!params.userId || typeof params.userId !== 'string') {
    throw new Error(
      '[getLatestHistoryForStandard] userId is required and must be a string. ' +
      'This may indicate a stale bundle. See troubleshooting/activity-history-engine-call-error.md'
    );
  }

  if (!params.standardId || typeof params.standardId !== 'string') {
    throw new Error(
      '[getLatestHistoryForStandard] standardId is required and must be a string. ' +
      'This may indicate a stale bundle. See troubleshooting/activity-history-engine-call-error.md'
    );
  }

  return getLatestHistoryForStandardInternal({
    ...params,
    firestore: firebaseFirestore,
  });
}

export function listenActivityHistoryForActivity(
  params: Omit<ListenActivityHistoryForActivityParams, 'firestore'>
) {
  return listenActivityHistoryForActivityInternal({
    ...params,
    firestore: firebaseFirestore,
  });
}

