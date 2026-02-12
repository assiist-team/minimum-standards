import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScorecardStackParamList } from './types';
import { ScorecardScreenWrapper } from './screenWrappers';
import { useTheme } from '../theme/useTheme';

const Stack = createNativeStackNavigator<ScorecardStackParamList>();

export function ActivitiesStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Scorecard"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background.screen },
      }}
    >
      <Stack.Screen name="Scorecard" component={ScorecardScreenWrapper} />
    </Stack.Navigator>
  );
}
