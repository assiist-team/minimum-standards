import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Standard } from '@minimum-standards/shared-model';
import {
  DashboardStackParamList,
  StandardsStackParamList,
  ActivitiesStackParamList,
} from './types';
import { ActivityHistoryScreen } from '../screens/ActivityHistoryScreen';
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
export function ScorecardScreenWrapper() {
  const navigation = useNavigation<ActivitiesNavigationProp>();
  const route = useRoute();
  const activityId = (route.params as { activityId?: string } | undefined)?.activityId;

  return (
    <ActivityHistoryScreen
      activityId={activityId}
      onBack={() => navigation.goBack()}
    />
  );
}

export function StandardsBuilderScreenWrapper() {
  const navigation = useNavigation<StandardsNavigationProp>();
  const route = useRoute();
  const standardId = (route.params as { standardId?: string })?.standardId;
  return (
    <StandardsBuilderScreen
      onBack={() => navigation.goBack()}
      standardId={standardId}
    />
  );
}

export function StandardsBuilderScreenWrapperForDashboard() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const route = useRoute();
  const standardId = (route.params as { standardId?: string })?.standardId;
  return (
    <StandardsBuilderScreen
      onBack={() => navigation.goBack()}
      standardId={standardId}
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
        // No navigation per Activity History plan - standard taps are now a no-op
        // Activity History is accessible via the button added in Task 04
      }}
      onNavigateToBuilder={() => {
        navigation.navigate('StandardsBuilder', {});
      }}
      onEditStandard={(standardId) => {
        navigation.navigate('StandardsBuilder', { standardId });
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
        // No navigation per Activity History plan - standard taps are now a no-op
        // Activity History is accessible via the button added in Task 04
      }}
      onEditStandard={(standardId) => {
        navigation.navigate('StandardsBuilder', { standardId });
      }}
      backButtonLabel={undefined}
    />
  );
}

export function StandardDetailScreenWrapper({ route }: { route: { params: { standardId: string } } }) {
  // LEGACY: StandardDetail screen is deprecated for consumer paths (dashboard/library card taps).
  // Standard taps are now a no-op per Activity History plan (Task 05).
  // This screen may still be used for builder/admin flows if needed.
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
