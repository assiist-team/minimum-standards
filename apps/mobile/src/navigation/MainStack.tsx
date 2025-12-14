import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import {
  ActivityLibraryScreenWrapper,
  StandardsBuilderScreenWrapper,
  StandardsLibraryScreenWrapper,
  ArchivedStandardsScreenWrapper,
  ActiveStandardsDashboardScreenWrapper,
  StandardDetailScreenWrapper,
} from './screenWrappers';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ActivityLibrary" component={ActivityLibraryScreenWrapper} />
      <Stack.Screen name="StandardsBuilder" component={StandardsBuilderScreenWrapper} />
      <Stack.Screen name="StandardsLibrary" component={StandardsLibraryScreenWrapper} />
      <Stack.Screen name="ArchivedStandards" component={ArchivedStandardsScreenWrapper} />
      <Stack.Screen name="ActiveStandardsDashboard" component={ActiveStandardsDashboardScreenWrapper} />
      <Stack.Screen name="StandardDetail" component={StandardDetailScreenWrapper} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// Add testID for testing purposes
MainStack.displayName = 'MainStack';
