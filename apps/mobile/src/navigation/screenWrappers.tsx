import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Standard } from '@minimum-standards/shared-model';
import {
  StandardsStackParamList,
  ScorecardStackParamList,
} from './types';
import { ActivityHistoryScreen } from '../screens/ActivityHistoryScreen';
import { StandardsBuilderScreen } from '../screens/StandardsBuilderScreen';
import { ActiveStandardsDashboardScreen } from '../screens/ActiveStandardsDashboardScreen';
import { StandardDetailScreen } from '../screens/StandardDetailScreen';
import { useStandards } from '../hooks/useStandards';

type StandardsNavigationProp = NativeStackNavigationProp<StandardsStackParamList>;
type ScorecardNavigationProp = NativeStackNavigationProp<ScorecardStackParamList>;

// Wrapper components that adapt existing screens to React Navigation
export function ScorecardScreenWrapper() {
  const navigation = useNavigation<ScorecardNavigationProp>();
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

export function ActiveStandardsDashboardScreenWrapper() {
  const navigation = useNavigation<StandardsNavigationProp>();
  return (
    <ActiveStandardsDashboardScreen
      onBack={() => {}}
      onLaunchBuilder={() => {
        navigation.navigate('StandardsBuilder', {});
      }}
      onNavigateToDetail={(standardId: string) => {
        // No navigation per Activity History plan - standard taps are now a no-op
      }}
      onEditStandard={(standardId) => {
        navigation.navigate('StandardsBuilder', { standardId });
      }}
      backButtonLabel={undefined}
    />
  );
}

export function StandardDetailScreenWrapper({ route }: { route: { params: { standardId: string } } }) {
  const navigation = useNavigation<StandardsNavigationProp>();
  const { standards } = useStandards();
  const standard = standards.find((s) => s.id === route.params.standardId);

  const handleEdit = (standardToEdit: Standard) => {
    if (standardToEdit) {
      navigation.navigate('StandardsBuilder', { standardId: standardToEdit.id });
    }
  };

  const handleArchive = (_standardId: string) => {};

  return (
    <StandardDetailScreen
      standardId={route.params.standardId}
      onBack={() => navigation.goBack()}
      onEdit={handleEdit}
      onArchive={handleArchive}
    />
  );
}
