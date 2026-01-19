import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivitiesStackParamList } from './types';
import { ScorecardScreenWrapper } from './screenWrappers';

const Stack = createNativeStackNavigator<ActivitiesStackParamList>();

export function ActivitiesStack() {
  return (
    <Stack.Navigator
      initialRouteName="Scorecard"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Scorecard" component={ScorecardScreenWrapper} />
    </Stack.Navigator>
  );
}
