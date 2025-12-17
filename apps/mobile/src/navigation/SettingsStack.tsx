import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SETTINGS_STACK_ROOT_SCREEN_NAME,
  SettingsStackParamList,
} from './types';
import { SettingsScreen } from '../screens/SettingsScreen';

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
    </Stack.Navigator>
  );
}
