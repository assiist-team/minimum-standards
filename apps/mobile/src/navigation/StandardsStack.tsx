import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StandardsStackParamList } from './types';
import {
  StandardsLibraryScreenWrapper,
  StandardsBuilderScreenWrapper,
  StandardDetailScreenWrapper,
} from './screenWrappers';

const Stack = createNativeStackNavigator<StandardsStackParamList>();

export function StandardsStack() {
  return (
    <Stack.Navigator
      initialRouteName="StandardsLibrary"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="StandardsLibrary" component={StandardsLibraryScreenWrapper} />
      <Stack.Screen name="StandardsBuilder" component={StandardsBuilderScreenWrapper} />
      <Stack.Screen name="StandardDetail" component={StandardDetailScreenWrapper} />
    </Stack.Navigator>
  );
}
