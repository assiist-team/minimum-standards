import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';

export interface StandardPeriodHeaderProps {
  periodLabel: string;
  currentTotal: number;
  targetValue: number;
  unit: string;
  progressPercent: number;
  activityName: string;
}

export function StandardPeriodHeader({
  periodLabel,
  currentTotal,
  targetValue,
  unit,
  progressPercent,
  activityName,
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
        <View style={styles.breadcrumb}>
          <Text style={[styles.breadcrumbText, { color: theme.text.secondary }]}>
            {activityName}
          </Text>
          <Text style={[styles.breadcrumbSeparator, { color: theme.text.secondary }]}> › </Text>
          <Text style={[styles.breadcrumbText, { color: theme.text.primary }]}>
            Period Logs
          </Text>
        </View>

        <Text style={[styles.periodLabel, { color: theme.text.primary }]}>
          {periodLabel}
        </Text>

        <View style={styles.progressSection}>
          <View style={[styles.progressBar, { backgroundColor: theme.border.secondary }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: theme.primary.main }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.text.secondary }]}>
            {progressText}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  content: {
    gap: 12,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 14,
  },
  periodLabel: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});