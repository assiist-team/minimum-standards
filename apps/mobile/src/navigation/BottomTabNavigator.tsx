import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { BottomTabParamList, SETTINGS_TAB_ROUTE_NAME } from './types';
import { StandardsStack } from './StandardsStack';
import { ActivitiesStack } from './ActivitiesStack';
import { SettingsStack } from './SettingsStack';
import { useTheme } from '../theme/useTheme';
import { useActivityHistoryEngine } from '../hooks/useActivityHistoryEngine';
import { getTabBarStyle } from '@nine4/ui-kit';

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Placeholder component for the Create tab (never actually renders)
function EmptyScreen() {
  return <View />;
}

export function BottomTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (__DEV__) {
      console.info('[BottomTabNavigator] safe area insets', insets);
    }
  }, [insets]);

  // Mount the Activity History Engine once at the authenticated app root
  // This ensures it runs for the whole session and avoids duplicate timers
  useActivityHistoryEngine();

  const tabBarStyle = getTabBarStyle(theme, insets);

  return (
    <Tab.Navigator
      initialRouteName="Standards"
      sceneContainerStyle={{ backgroundColor: theme.background.screen }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabBar.activeTint,
        tabBarInactiveTintColor: theme.tabBar.inactiveTint,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Standards"
        component={StandardsStack}
        options={{
          tabBarLabel: 'Standards',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="pending-actions" size={size || 24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Standards tab',
        }}
      />
      <Tab.Screen
        name="Scorecard"
        component={ActivitiesStack}
        options={{
          tabBarLabel: 'Scorecard',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="assessment" size={size || 24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Scorecard tab',
        }}
      />
      <Tab.Screen
        name={SETTINGS_TAB_ROUTE_NAME}
        component={SettingsStack}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size || 24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Settings tab',
        }}
      />
      <Tab.Screen
        name="Create"
        component={EmptyScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add" size={size || 24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Create standard',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('CreateStandardFlow');
          },
        })}
      />
    </Tab.Navigator>
  );
}
