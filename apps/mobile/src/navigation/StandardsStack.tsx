import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StandardsStackParamList } from './types';
import {
  ActiveStandardsDashboardScreenWrapper,
  StandardsBuilderScreenWrapper,
  StandardDetailScreenWrapper,
} from './screenWrappers';

const Stack = createNativeStackNavigator<StandardsStackParamList>();

export function StandardsStack() {
  return (
    <Stack.Navigator
      initialRouteName="ActiveStandardsDashboard"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ActiveStandardsDashboard" component={ActiveStandardsDashboardScreenWrapper} />
      <Stack.Screen name="StandardsBuilder" component={StandardsBuilderScreenWrapper} />
      <Stack.Screen name="StandardDetail" component={StandardDetailScreenWrapper} />
    </Stack.Navigator>
  );
}
