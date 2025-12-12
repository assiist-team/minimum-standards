import { FirestoreDataConverter } from 'firebase/firestore';
import { Activity, ActivityLog, Standard } from '@minimum-standards/shared-model';
export declare const activityConverter: FirestoreDataConverter<Activity>;
export declare const standardConverter: FirestoreDataConverter<Standard>;
export declare const activityLogConverter: FirestoreDataConverter<ActivityLog>;
