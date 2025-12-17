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

export function StandardsBuilderScreenWrapperForDashboard() {
  const navigation = useNavigation<DashboardNavigationProp>();
  return (
    <StandardsBuilderScreen
      onBack={() => navigation.goBack()}
    />
  );
}

export function StandardsLibraryScreenWrapper() {
  const navigation = useNavigation<StandardsNavigationProp>();
  const canGoBack = navigation.canGoBack();
  return (
    <StandardsLibraryScreen
      onBack={canGoBack ? () => navigation.goBack() : undefined}
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
  // Dashboard is always the root screen of DashboardStack, so never show back button
  return (
    <ActiveStandardsDashboardScreen
      onBack={() => {}}
      onLaunchBuilder={() => {
        // Navigate to StandardsBuilder within the Dashboard stack
        navigation.navigate('StandardsBuilder', {});
      }}
      onNavigateToDetail={(standardId: string) => {
        navigation.navigate('StandardDetail', { standardId });
      }}
      backButtonLabel={undefined}
    />
  );
}

export function StandardDetailScreenWrapper({ route }: { route: { params: { standardId: string } } }) {
  // StandardDetail can be in Dashboard or Standards stack
  const navigation = useNavigation<DashboardNavigationProp | StandardsNavigationProp>();
  const { standards } = useStandards();
  const standard = standards.find((s) => s.id === route.params.standardId);

  const handleEdit = (standardToEdit: Standard) => {
    // Navigate to StandardsBuilder within the same stack (Dashboard or Standards)
    // Both stacks now have StandardsBuilder, so we can navigate directly
    if (standardToEdit) {
      // Check which stack we're in by checking the navigation state
      const state = navigation.getState();
      const currentRoute = state.routes[state.index];
      
      // Determine if we're in Dashboard or Standards stack by checking parent
      const parent = navigation.getParent();
      if (parent) {
        const parentState = parent.getState();
        const parentRoute = parentState.routes[parentState.index];
        
        // If parent route is 'Dashboard', navigate within Dashboard stack
        if (parentRoute.name === 'Dashboard') {
          (navigation as DashboardNavigationProp).navigate('StandardsBuilder', { standardId: standardToEdit.id });
        } else if (parentRoute.name === 'Standards') {
          // Navigate within Standards stack
          (navigation as StandardsNavigationProp).navigate('StandardsBuilder', { standardId: standardToEdit.id });
        }
      } else {
        // Fallback: try Dashboard navigation first
        (navigation as DashboardNavigationProp).navigate('StandardsBuilder', { standardId: standardToEdit.id });
      }
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
