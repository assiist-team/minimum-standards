/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Disable all LogBox warnings and errors in the UI
LogBox.ignoreAllLogs(true);

AppRegistry.registerComponent(appName, () => App);
