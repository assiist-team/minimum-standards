import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Standard } from '@minimum-standards/shared-model';
import {
  DashboardStackParamList,
  StandardsStackParamList,
  ActivitiesStackParamList,
} from './types';
import { ActivityLibraryScreen } from '../screens/ActivityLibraryScreen';
import { StandardsBuilderScreen } from '../screens/StandardsBuilderScreen';
import { StandardsLibraryScreen } from '../screens/StandardsLibraryScreen';
import { ArchivedStandardsScreen } from '../screens/ArchivedStandardsScreen';
import { ActiveStandardsDashboardScreen } from '../screens/ActiveStandardsDashboardScreen';
import { StandardDetailScreen } from '../screens/StandardDetailScreen';
import { useStandards } from '../hooks/useStandards';

type DashboardNavigationProp = NativeStackNavigationProp<DashboardStackParamList>;
type StandardsNavigationProp = NativeStackNavigationProp<StandardsStackParamList>;
type ActivitiesNavigationProp = NativeStackNavigationProp<ActivitiesStackParamList>;

// Wrapper components that adapt existing screens to React Navigation
export function ActivityLibraryScreenWrapper() {
  const navigation = useNavigation<ActivitiesNavigationProp>();
  const canGoBack = navigation.canGoBack();
  // When ActivityLibrary is tab root, don't show close button
  return (
    <ActivityLibraryScreen
      onClose={canGoBack ? () => navigation.goBack() : undefined}
    />
  );
}

export function StandardsBuilderScreenWrapper() {
  const navigation = useNavigation<StandardsNavigationProp>();
  return (
    <StandardsBuilderScreen
      onBack={() => navigation.goBack()}
    />
  );
}

export function StandardsLibraryScreenWrapper() {
  const navigation = useNavigation<StandardsNavigationProp>();
  return (
    <StandardsLibraryScreen
      onBack={() => navigation.goBack()}
      onSelectStandard={(standard) => {
        // Navigate to Standard Detail when a standard is selected
        navigation.navigate('StandardDetail', { standardId: standard.id });
      }}
      onNavigateToBuilder={() => {
        navigation.navigate('StandardsBuilder', {});
      }}
    />
  );
}

export function ArchivedStandardsScreenWrapper() {
  const navigation = useNavigation<StandardsNavigationProp>();
  return (
    <ArchivedStandardsScreen
      onBack={() => navigation.goBack()}
    />
  );
}

export function ActiveStandardsDashboardScreenWrapper() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const canGoBack = navigation.canGoBack();
  // When Dashboard is tab root, don't show back button
  return (
    <ActiveStandardsDashboardScreen
      onBack={canGoBack ? () => navigation.goBack() : () => {}}
      onLaunchBuilder={() => {
        // Navigate to Standards tab and then to Builder
        // Use getParent to access the tab navigator
        const tabNavigator = navigation.getParent();
        if (tabNavigator) {
          // @ts-expect-error - React Navigation types don't fully support nested navigation
          tabNavigator.navigate('Standards', { screen: 'StandardsBuilder' });
        }
      }}
      onNavigateToDetail={(standardId) => {
        navigation.navigate('StandardDetail', { standardId });
      }}
      backButtonLabel={canGoBack ? '← Back' : undefined}
    />
  );
}

export function StandardDetailScreenWrapper({ route }: { route: { params: { standardId: string } } }) {
  // StandardDetail can be in Dashboard or Standards stack
  const navigation = useNavigation<DashboardNavigationProp | StandardsNavigationProp>();
  const { standards } = useStandards();
  const standard = standards.find((s) => s.id === route.params.standardId);

  const handleEdit = (standardToEdit: Standard) => {
    // Navigate to Standards tab and then to Builder with the standard
    const tabNavigator = navigation.getParent();
    if (tabNavigator && standardToEdit) {
      // @ts-expect-error - React Navigation types don't fully support nested navigation
      tabNavigator.navigate('Standards', { screen: 'StandardsBuilder', params: { standardId: standardToEdit.id } });
    }
  };

  const handleArchive = (_standardId: string) => {
    // Archive/unarchive logic is handled by the screen itself via useStandards hook
    // This callback can be used for navigation or other side effects after archiving
    // For now, we don't need to do anything special
  };

  return (
    <StandardDetailScreen
      standardId={route.params.standardId}
      onBack={() => navigation.goBack()}
      onEdit={handleEdit}
      onArchive={handleArchive}
    />
  );
}
