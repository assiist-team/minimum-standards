import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { BottomTabNavigator } from './BottomTabNavigator';
import { CreateStandardFlow } from './CreateStandardFlow';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen
        name="CreateStandardFlow"
        component={CreateStandardFlow}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}

// Add testID for testing purposes
MainStack.displayName = 'MainStack';
