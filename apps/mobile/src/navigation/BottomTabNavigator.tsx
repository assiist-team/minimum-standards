import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { BottomTabParamList, SETTINGS_TAB_ROUTE_NAME } from './types';
import { DashboardStack } from './DashboardStack';
import { StandardsStack } from './StandardsStack';
import { ActivitiesStack } from './ActivitiesStack';
import { SettingsStack } from './SettingsStack';
import { useTheme } from '../theme/useTheme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export function BottomTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabBar.activeTint,
        tabBarInactiveTintColor: theme.tabBar.inactiveTint,
        tabBarStyle: {
          backgroundColor: theme.tabBar.background,
          borderTopColor: theme.tabBar.border,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8),
          paddingTop: 8,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
          height: Platform.OS === 'ios' ? 88 : 64,
        },
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
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Active',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size || 24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Active tab',
        }}
      />
      <Tab.Screen
        name="Standards"
        component={StandardsStack}
        options={{
          tabBarLabel: 'Standards Library',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="list" size={size || 24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Standards Library tab',
        }}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesStack}
        options={{
          tabBarLabel: 'Activities Library',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="star" size={size || 24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Activities Library tab',
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
    </Tab.Navigator>
  );
}
