import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

/**
 * Centralized Firebase client handles so we only instantiate the native SDKs once.
 * React Native Firebase recommends using the modular getters (`getAuth`, `getFirestore`)
 * rather than the deprecated namespaced helpers (`auth()`, `firestore()`).
 */
const firebaseApp = getApp();
const firebaseAuth = getAuth(firebaseApp);
const firebaseFirestore = getFirestore(firebaseApp);

export { firebaseApp, firebaseAuth, firebaseFirestore };
