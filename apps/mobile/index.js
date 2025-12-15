/**
 * @format
 */

import 'react-native-gesture-handler';
// DEBUG: This should print immediately when JS loads
console.log('=== INDEX.JS EXECUTING ===');

import { AppRegistry, LogBox } from 'react-native';
import { name as appName } from './app.json';

// Force register RCTEventEmitter to fix React Native 0.83 Fabric bug
try {
  const { BatchedBridge } = require('react-native/Libraries/BatchedBridge/BatchedBridge');
  const RCTEventEmitter = require('react-native/Libraries/EventEmitter/RCTEventEmitter');
  
  if (RCTEventEmitter && RCTEventEmitter.default) {
    console.log('[index.js] Manually registering RCTEventEmitter...');
    BatchedBridge.registerCallableModule('RCTEventEmitter', RCTEventEmitter.default);
    console.log('[index.js] RCTEventEmitter registered successfully');
  }
} catch (error) {
  console.error('[index.js] Failed to register RCTEventEmitter:', error);
}

let AppComponent;
try {
  console.log('[index.js] Attempting to load App component...');
  // Use require so we can surface module-level errors immediately.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AppComponent = require('./App').default;
  if (!AppComponent) {
    throw new Error('App module did not export a default component');
  }
  console.log('[index.js] App component loaded successfully');
} catch (error) {
  console.error('[index.js] ERROR: Failed to load App component:', error);
  throw error;
}

const appRegistryWatchdogTimeoutMs = 3000;
let appRegistryInvoked = false;
const appRegistryWatchdogId = setTimeout(() => {
  if (!appRegistryInvoked) {
    console.error(
      `[index.js] ERROR: Native never requested the root component "${appName}" within ${appRegistryWatchdogTimeoutMs}ms`
    );
  }
}, appRegistryWatchdogTimeoutMs);

// Show all errors during debugging
// LogBox.ignoreAllLogs(true);

AppRegistry.registerComponent(appName, () => {
  if (!appRegistryInvoked) {
    console.log('[index.js] Registering App component with AppRegistry');
    appRegistryInvoked = true;
    clearTimeout(appRegistryWatchdogId);
  }
  return AppComponent;
});
