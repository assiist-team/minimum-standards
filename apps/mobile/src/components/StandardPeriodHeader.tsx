import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { StandardSessionConfig } from '@minimum-standards/shared-model';
import { SCREEN_PADDING } from '../theme/spacing';

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
        <View style={[styles.breadcrumb]}>
          <Text style={[styles.breadcrumbText, { color: theme.text.secondary }]}>
            {activityName}
          </Text>
          <Text style={[styles.breadcrumbSeparator, { color: theme.text.tertiary }]}> › </Text>
          <Text style={[styles.breadcrumbText, { color: theme.text.primary }]}>
            {periodLabel}
          </Text>
        </View>

        <View style={styles.progressSection}>
          <View style={[styles.progressBar, { backgroundColor: theme.border.secondary }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: progressPercent >= 100 ? theme.status.met.barComplete : theme.status.met.bar }
              ]}
            />
          </View>
          <View style={styles.progressAndSessionRow}>
            <Text style={[styles.sessionData, { color: theme.text.secondary, textAlign: 'left' }]}>
              {progressText}
            </Text>
            {sessionConfig && sessionConfig.sessionsPerCadence > 1 && (
              <Text style={[styles.sessionData, { color: theme.text.secondary }]}>
                {sessionConfig.sessionsPerCadence} {sessionConfig.sessionsPerCadence === 1 ? sessionConfig.sessionLabel : `${sessionConfig.sessionLabel}s`} × {formatValue(sessionConfig.volumePerSession)} {unit}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SCREEN_PADDING,
    paddingBottom: SCREEN_PADDING,
    marginHorizontal: -SCREEN_PADDING,
  },
  content: {
    gap: 16,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'left',
    letterSpacing: 0.1,
    flex: 1,
  },
  progressAndSessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionData: {
    fontSize: 13,
    fontWeight: '500',
  },
});