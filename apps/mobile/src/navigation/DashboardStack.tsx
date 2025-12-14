import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardStackParamList } from './types';
import {
  ActiveStandardsDashboardScreenWrapper,
  StandardDetailScreenWrapper,
} from './screenWrappers';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStack() {
  return (
    <Stack.Navigator
      initialRouteName="ActiveStandardsDashboard"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ActiveStandardsDashboard"
        component={ActiveStandardsDashboardScreenWrapper}
      />
      <Stack.Screen name="StandardDetail" component={StandardDetailScreenWrapper} />
    </Stack.Navigator>
  );
}
