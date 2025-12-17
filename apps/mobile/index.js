/**
 * @format
 */

import 'react-native-gesture-handler';
// DEBUG: This should print immediately when JS loads
console.log('=== INDEX.JS EXECUTING ===');

import { AppRegistry, LogBox } from 'react-native';
import { name as appName } from './app.json';
import App from './App';

// Show all errors during debugging
// LogBox.ignoreAllLogs(true);

AppRegistry.registerComponent(appName, () => {
  console.log('[index.js] Registering App component with AppRegistry');
  return App;
});
