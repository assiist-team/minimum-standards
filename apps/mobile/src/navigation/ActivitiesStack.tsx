import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivitiesStackParamList } from './types';
import { ActivityLibraryScreenWrapper, ActivityHistoryScreenWrapper } from './screenWrappers';

const Stack = createNativeStackNavigator<ActivitiesStackParamList>();

export function ActivitiesStack() {
  return (
    <Stack.Navigator
      initialRouteName="ActivityLibrary"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ActivityLibrary" component={ActivityLibraryScreenWrapper} />
      <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreenWrapper} />
    </Stack.Navigator>
  );
}
