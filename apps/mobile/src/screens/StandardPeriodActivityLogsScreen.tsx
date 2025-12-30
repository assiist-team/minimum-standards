import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { ErrorBanner } from '../components/ErrorBanner';
import { useStandardPeriodActivityLogs } from '../hooks/useStandardPeriodActivityLogs';
import { useStandards } from '../hooks/useStandards';
import { useActivities } from '../hooks/useActivities';
import { StandardPeriodHeader } from '../components/StandardPeriodHeader';
import { ActivityLogsList } from '../components/ActivityLogsList';
import { calculatePeriodWindow } from '@minimum-standards/shared-model';

const CARD_SPACING = 16;

type RouteProps = RouteProp<RootStackParamList, 'StandardPeriodActivityLogs'>;

export function StandardPeriodActivityLogsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { standardId, periodStartMs, periodEndMs } = route.params;

  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Get standard and activity information
  const { standards } = useStandards();
  const { activities } = useActivities();

  const standard = useMemo(
    () => standards.find(s => s.id === standardId),
    [standards, standardId]
  );

  const activity = useMemo(
    () => activities.find(a => a.id === standard?.activityId),
    [activities, standard?.activityId]
  );

  // Calculate period boundaries and label if not provided
  const periodInfo = useMemo(() => {
    if (periodStartMs && periodEndMs) {
      // Historical period - calculate label
      if (standard) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
        const window = calculatePeriodWindow(
          periodStartMs,
          standard.cadence,
          timezone,
          { periodStartPreference: standard.periodStartPreference }
        );
        return {
          startMs: periodStartMs,
          endMs: periodEndMs,
          label: window.label,
        };
      }
      return null;
    } else if (standard) {
      // Current period - calculate boundaries and label
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
      const window = calculatePeriodWindow(
        Date.now(),
        standard.cadence,
        timezone,
        { periodStartPreference: standard.periodStartPreference }
      );
      return {
        startMs: window.startMs,
        endMs: window.endMs,
        label: window.label,
      };
    }
    return null;
  }, [periodStartMs, periodEndMs, standard]);

  // Fetch activity logs
  const {
    logs,
    loading,
    error,
    hasMore,
    loadMore,
  } = useStandardPeriodActivityLogs(
    standardId,
    periodInfo?.startMs,
    periodInfo?.endMs,
    standard
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRefresh = () => {
    // For now, just re-fetch by triggering a re-render
    // The hook will handle re-fetching
    if (standardId) {
      // This will cause the hook to re-run
    }
  };

  const handleEditLog = (log: any) => {
    // TODO: Implement log editing
    console.log('Edit log:', log);
  };

  const handleDeleteLog = (log: any) => {
    // TODO: Implement log deletion
    console.log('Delete log:', log);
  };

  if (!standard || !activity || !periodInfo) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background.screen }]}>
        <ErrorBanner error={new Error('Standard or period information not found')} />
      </View>
    );
  }

  // Calculate progress for the header
  const totalValue = logs.reduce((sum, log) => sum + log.value, 0);
  const progressPercent = standard.minimum > 0 ? Math.min((totalValue / standard.minimum) * 100, 100) : 0;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background.screen }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background.chrome,
            borderBottomColor: theme.border.secondary,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        <TouchableOpacity 
          onPress={handleBack} 
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.primary.main} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
          Activity Logs
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ErrorBanner error={error} />

      {/* Period Summary */}
      <StandardPeriodHeader
        periodLabel={periodInfo.label}
        currentTotal={totalValue}
        targetValue={standard.minimum}
        unit={standard.unit}
        progressPercent={progressPercent}
        activityName={activity.name}
        sessionConfig={standard.sessionConfig}
      />

      {/* Activity Logs */}
      <ActivityLogsList
        logs={logs}
        loading={loading}
        hasMore={hasMore}
        onRefresh={handleRefresh}
        onLoadMore={loadMore}
        onEditLog={handleEditLog}
        onDeleteLog={handleDeleteLog}
        unit={standard.unit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24, // Match back icon width for centering
  },
});