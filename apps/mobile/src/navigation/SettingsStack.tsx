import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SETTINGS_STACK_ROOT_SCREEN_NAME,
  SettingsStackParamList,
} from './types';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CategorySettingsScreen } from '../screens/CategorySettingsScreen';
import { ActivitySettingsScreen } from '../screens/ActivitySettingsScreen';
import { SnapshotsScreen } from '../screens/SnapshotsScreen';
import { SnapshotCreateScreen } from '../screens/SnapshotCreateScreen';
import { SnapshotDetailScreen } from '../screens/SnapshotDetailScreen';
import { SnapshotEditScreen } from '../screens/SnapshotEditScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator
      initialRouteName={SETTINGS_STACK_ROOT_SCREEN_NAME}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={SETTINGS_STACK_ROOT_SCREEN_NAME} component={SettingsScreen} />
      <Stack.Screen name="Categories" component={CategorySettingsScreen} />
      <Stack.Screen name="Activities" component={ActivitySettingsScreen} />
      <Stack.Screen name="Snapshots" component={SnapshotsScreen} />
      <Stack.Screen name="SnapshotCreate" component={SnapshotCreateScreen} />
      <Stack.Screen name="SnapshotDetail" component={SnapshotDetailScreen} />
      <Stack.Screen name="SnapshotEdit" component={SnapshotEditScreen} />
    </Stack.Navigator>
  );
}
