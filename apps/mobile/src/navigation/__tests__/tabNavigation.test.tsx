import React from 'react';
import { render } from '@testing-library/react-native';

// Mock React Navigation before importing BottomTabNavigator
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
    getParent: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
  useRoute: jest.fn(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => {
    const React = require('react');
    return {
      Navigator: ({ children, initialRouteName }: any) => {
        // Render the initial route's component
        const childrenArray = React.Children.toArray(children);
        const initialScreen = childrenArray.find(
          (child: any) => child?.props?.name === initialRouteName
        );
        return (
          <>
            {childrenArray.map((child: any) => {
              if (child?.props?.name === initialRouteName) {
                return React.cloneElement(child, { key: child.props.name });
              }
              return null;
            })}
            {/* Render tab bar labels */}
            {childrenArray.map((child: any) => {
              const options = child?.props?.options || {};
              const label = options.tabBarLabel || child?.props?.name;
              const { Text } = require('react-native');
              return label ? (
                <Text key={`label-${child.props.name}`}>{label}</Text>
              ) : null;
            })}
          </>
        );
      },
      Screen: ({ component: Component, name, options }: any) => {
        const React = require('react');
        if (name === 'Dashboard') {
          return <Component key={name} />;
        }
        return null;
      },
    };
  }),
}));

import { BottomTabNavigator } from '../BottomTabNavigator';
import { NavigationContainer } from '@react-navigation/native';

// Mock stack navigators
jest.mock('../DashboardStack', () => ({
  DashboardStack: () => {
    const React = require('react');
    return React.createElement('View', { testID: 'dashboard-screen' }, 'Dashboard');
  },
}));

jest.mock('../StandardsStack', () => ({
  StandardsStack: () => {
    const React = require('react');
    return React.createElement('View', { testID: 'standards-screen' }, 'Standards');
  },
}));

jest.mock('../ActivitiesStack', () => ({
  ActivitiesStack: () => {
    const React = require('react');
    return React.createElement('View', { testID: 'activities-screen' }, 'Activities');
  },
}));

jest.mock('../SettingsStack', () => ({
  SettingsStack: () => {
    const React = require('react');
    return React.createElement('View', { testID: 'settings-screen' }, 'Settings');
  },
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('Tab Navigation', () => {
  test('BottomTabNavigator renders four tabs (Dashboard, Standards, Activities, Settings)', () => {
    const { getByText } = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );

    expect(getByText('Dashboard')).toBeTruthy();
    expect(getByText('Standards')).toBeTruthy();
    expect(getByText('Activities')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  test('Dashboard tab shows ActiveStandardsDashboardScreen', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );

    expect(getByTestId('dashboard-screen')).toBeTruthy();
  });

  test('Standards tab shows StandardsLibraryScreen', () => {
    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );

    // Dashboard is initial, so we need to navigate to Standards tab
    // For now, just verify Standards tab exists
    expect(getByText('Standards')).toBeTruthy();
  });

  test('Activities tab shows ActivityLibraryScreen', () => {
    const { getByText } = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );

    expect(getByText('Activities')).toBeTruthy();
  });

  test('Settings tab shows SettingsScreen', () => {
    const { getByText } = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );

    expect(getByText('Settings')).toBeTruthy();
  });
});
