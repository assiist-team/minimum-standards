import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { StandardSessionConfig } from '@minimum-standards/shared-model';

export interface StandardPeriodHeaderProps {
  periodLabel: string;
  currentTotal: number;
  targetValue: number;
  unit: string;
  progressPercent: number;
  activityName: string;
  sessionConfig?: StandardSessionConfig;
}

export function StandardPeriodHeader({
  periodLabel,
  currentTotal,
  targetValue,
  unit,
  progressPercent,
  activityName,
  sessionConfig,
}: StandardPeriodHeaderProps) {
  const theme = useTheme();

  const formatValue = (value: number): string => {
    // Round to 1 decimal place for display
    return Math.round(value * 10) / 10 === Math.round(value)
      ? Math.round(value).toString()
      : (Math.round(value * 10) / 10).toString();
  };

  const progressText = `${formatValue(currentTotal)} / ${formatValue(targetValue)} ${unit}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.background.card, borderBottomColor: theme.border.secondary }]}>
      <View style={styles.content}>
        <View style={[styles.breadcrumb, { alignSelf: 'center' }]}>
          <Text style={[styles.breadcrumbText, { color: theme.text.secondary }]}>
            {activityName}
          </Text>
          <Text style={[styles.breadcrumbSeparator, { color: theme.text.tertiary }]}> › </Text>
          <Text style={[styles.breadcrumbText, { color: theme.text.primary }]}>
            Period Logs
          </Text>
        </View>

        <Text style={[styles.periodLabel, { color: theme.text.primary, textAlign: 'center' }]}>
          {periodLabel}
        </Text>

        <View style={styles.progressSection}>
          <View style={[styles.progressBar, { backgroundColor: theme.border.secondary }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: progressPercent >= 100 ? '#4A7C59' : theme.button.primary.background }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.text.secondary }]}>
            {progressText}
          </Text>
        </View>

        {sessionConfig && sessionConfig.sessionsPerCadence > 1 && (
          <View style={styles.sessionSection}>
            <Text style={[styles.sessionTotal, { color: theme.text.primary }]}>
              Total: {formatValue(currentTotal)} {unit}
            </Text>
            <Text style={[styles.sessionData, { color: theme.text.secondary }]}>
              {sessionConfig.sessionsPerCadence} {sessionConfig.sessionsPerCadence === 1 ? sessionConfig.sessionLabel : `${sessionConfig.sessionLabel}s`} × {formatValue(sessionConfig.volumePerSession)} {unit}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  content: {
    gap: 16,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  breadcrumbSeparator: {
    fontSize: 13,
  },
  periodLabel: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  progressSection: {
    gap: 10,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  sessionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sessionTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionData: {
    fontSize: 13,
    fontWeight: '500',
  },
});