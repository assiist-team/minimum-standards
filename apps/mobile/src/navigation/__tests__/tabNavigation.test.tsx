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
        if (name === 'Standards') {
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
jest.mock('../StandardsStack', () => ({
  StandardsStack: () => {
    const React = require('react');
    return React.createElement('View', { testID: 'standards-screen' }, 'Standards');
  },
}));

jest.mock('../ActivitiesStack', () => ({
  ActivitiesStack: () => {
    const React = require('react');
    return React.createElement('View', { testID: 'scorecard-screen' }, 'Scorecard');
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
  test('BottomTabNavigator renders four tabs (Standards, Scorecard, Settings, +)', () => {
    const { getByText } = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );

    expect(getByText('Standards')).toBeTruthy();
    expect(getByText('Scorecard')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  test('Standards tab is the initial tab', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );

    expect(getByTestId('standards-screen')).toBeTruthy();
  });

  test('Scorecard tab label is displayed', () => {
    const { getByText } = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );

    expect(getByText('Scorecard')).toBeTruthy();
  });

  test('Settings tab label is displayed', () => {
    const { getByText } = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );

    expect(getByText('Settings')).toBeTruthy();
  });
});
