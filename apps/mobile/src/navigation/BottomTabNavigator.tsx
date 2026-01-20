import React, { useCallback, useEffect, useMemo } from 'react';
import { BottomTabBar, type BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { type LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { BottomTabParamList, SETTINGS_TAB_ROUTE_NAME } from './types';
import { DashboardStack } from './DashboardStack';
import { StandardsStack } from './StandardsStack';
import { ActivitiesStack } from './ActivitiesStack';
import { SettingsStack } from './SettingsStack';
import { useTheme } from '../theme/useTheme';
import { useStandards } from '../hooks/useStandards';
import { useActivities } from '../hooks/useActivities';
import { StickyLogButton } from '../components/StickyLogButton';
import { useActivityHistoryEngine } from '../hooks/useActivityHistoryEngine';

const Tab = createBottomTabNavigator<BottomTabParamList>();

function TabBarWithStickyLogButton(props: BottomTabBarProps) {
  const theme = useTheme();
  const { createLogEntry, updateLogEntry } = useStandards();
  const { allActivities } = useActivities();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);

  const activityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allActivities.forEach((activity) => {
      map.set(activity.id, activity.name);
    });
    return map;
  }, [allActivities]);

  // Only show the sticky log button on the Dashboard tab
  const currentRoute = props.state.routes[props.state.index]?.name;
  const showStickyLogButton = currentRoute === 'Dashboard';
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    if (__DEV__) {
      const { height } = event.nativeEvent.layout;
      console.info('[TabBarWithStickyLogButton] layout', { height });
    }
  }, []);

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.tabBarShell,
        {
          backgroundColor: Platform.OS === 'android' ? theme.background.screen : theme.tabBar.background,
          borderTopColor: theme.tabBar.border,
          marginBottom: Platform.OS === 'android' ? bottomInset : 0,
        },
      ]}
    >
      {showStickyLogButton && (
        <StickyLogButton
          onCreateLogEntry={createLogEntry}
          onUpdateLogEntry={updateLogEntry}
          resolveActivityName={(activityId) => activityNameMap.get(activityId)}
        />
      )}
      <BottomTabBar {...props} />
    </View>
  );
}

export function BottomTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const baseTabBarHeight = Platform.OS === 'ios' ? 88 : 64;
  const baseBottomPadding = Platform.OS === 'ios' ? 20 : 12;
  const bottomPadding =
    Platform.OS === 'ios' ? Math.max(insets.bottom, baseBottomPadding) : baseBottomPadding;
  const androidMinHeight = baseTabBarHeight + bottomPadding;

  useEffect(() => {
    if (__DEV__) {
      console.info('[BottomTabNavigator] safe area insets', insets);
    }
  }, [insets]);
  
  // Mount the Activity History Engine once at the authenticated app root
  // This ensures it runs for the whole session and avoids duplicate timers
  useActivityHistoryEngine();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(props) => <TabBarWithStickyLogButton {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabBar.activeTint,
        tabBarInactiveTintColor: theme.tabBar.inactiveTint,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
          paddingTop: 8,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
          paddingBottom: bottomPadding,
          height: Platform.OS === 'ios' ? baseTabBarHeight : undefined,
          minHeight: Platform.OS === 'ios' ? undefined : androidMinHeight,
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
            <MaterialIcons name="star" size={size || 24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Active tab',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Get the current state of the tab navigator
            const state = navigation.getState();
            const dashboardTab = state.routes.find((r) => r.name === 'Dashboard');
            
            // If the Dashboard tab has a nested stack with more than one screen, reset it to root
            if (dashboardTab?.state && dashboardTab.state.index > 0) {
              // Prevent default navigation
              e.preventDefault();
              
              // Reset the Dashboard stack by using CommonActions.reset with updated state
              const dashboardRouteIndex = state.routes.findIndex((r) => r.name === 'Dashboard');
              
              navigation.dispatch(
                CommonActions.reset({
                  ...state,
                  routes: state.routes.map((route, index) => {
                    if (index === dashboardRouteIndex) {
                      // Reset the Dashboard stack to its root
                      return {
                        ...route,
                        state: {
                          routes: [{ name: 'ActiveStandardsDashboard' }],
                          index: 0,
                        },
                      };
                    }
                    return route;
                  }),
                  index: dashboardRouteIndex,
                })
              );
            }
          },
        })}
      />
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
        name="Activities"
        component={ActivitiesStack}
        options={{
          tabBarLabel: 'Scorecard',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="task-alt" size={size || 24} color={color} />
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
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarShell: {
    borderTopWidth: 1,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
});
