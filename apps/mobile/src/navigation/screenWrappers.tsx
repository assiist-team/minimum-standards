import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { ActivityLibraryScreen } from '../screens/ActivityLibraryScreen';
import { StandardsBuilderScreen } from '../screens/StandardsBuilderScreen';
import { StandardsLibraryScreen } from '../screens/StandardsLibraryScreen';
import { ArchivedStandardsScreen } from '../screens/ArchivedStandardsScreen';
import { ActiveStandardsDashboardScreen } from '../screens/ActiveStandardsDashboardScreen';
import { StandardDetailScreen } from '../screens/StandardDetailScreen';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Wrapper components that adapt existing screens to React Navigation
export function ActivityLibraryScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  return (
    <ActivityLibraryScreen
      onClose={() => navigation.goBack()}
    />
  );
}

export function StandardsBuilderScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  return (
    <StandardsBuilderScreen
      onBack={() => navigation.goBack()}
    />
  );
}

export function StandardsLibraryScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  return (
    <StandardsLibraryScreen
      onBack={() => navigation.goBack()}
      onSelectStandard={(standardId) => {
        navigation.navigate('StandardDetail', { standardId });
      }}
    />
  );
}

export function ArchivedStandardsScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  return (
    <ArchivedStandardsScreen
      onBack={() => navigation.goBack()}
    />
  );
}

export function ActiveStandardsDashboardScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  return (
    <ActiveStandardsDashboardScreen
      onBack={() => navigation.goBack()}
      onLaunchBuilder={() => navigation.navigate('StandardsBuilder')}
      onNavigateToDetail={(standardId) => {
        navigation.navigate('StandardDetail', { standardId });
      }}
    />
  );
}

export function StandardDetailScreenWrapper({ route }: { route: { params: { standardId: string } } }) {
  const navigation = useNavigation<NavigationProp>();
  return (
    <StandardDetailScreen
      standardId={route.params.standardId}
      onBack={() => navigation.goBack()}
    />
  );
}
