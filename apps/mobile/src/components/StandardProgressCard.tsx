import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Standard } from '@minimum-standards/shared-model';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/useTheme';
import { getStatusColors } from '../theme/colors';
import { typography } from '../theme/typography';

export interface StandardProgressCardProps {
  standard: Standard;
  activityName: string;
  periodLabel: string;
  currentTotal: number;
  currentTotalFormatted: string;
  targetValue: number;
  targetValueFormatted: string;
  progressPercent: number;
  status: 'Met' | 'In Progress' | 'Missed';
  currentSessions: number;
  targetSessions: number;
  sessionLabel: string;
  unit: string;
  showLogButton?: boolean;
  onLogPress?: () => void;
  onCardPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const CARD_SPACING = 16;

export function StandardProgressCard({
  standard,
  activityName,
  periodLabel,
  currentTotal,
  currentTotalFormatted,
  targetValue,
  targetValueFormatted,
  progressPercent,
  status,
  currentSessions,
  targetSessions,
  sessionLabel,
  unit,
  showLogButton = false,
  onLogPress,
  onCardPress,
  onEdit,
  onDelete,
}: StandardProgressCardProps) {
  const theme = useTheme();
  
  // Use green (met) color for progress bar when status is Met, otherwise use inProgress color
  const progressBarColor = status === 'Met' 
    ? getStatusColors(theme, 'Met').bar 
    : getStatusColors(theme, 'In Progress').bar;
  
  // Format volume/period: "75 minutes / week"
  const { interval, unit: cadenceUnit } = standard.cadence;
  const cadenceStr = interval === 1 ? cadenceUnit : `${interval} ${cadenceUnit}s`;
  const volumePeriodText = `${standard.minimum} ${standard.unit} / ${cadenceStr}`;
  
  // Format session params: "5 sessions × 15 minutes"
  const sessionConfig = standard.sessionConfig;
  const sessionLabelPlural = sessionConfig.sessionsPerCadence === 1 
    ? sessionConfig.sessionLabel 
    : `${sessionConfig.sessionLabel}s`;
  const sessionParamsText = `${sessionConfig.sessionsPerCadence} ${sessionLabelPlural} × ${sessionConfig.volumePerSession} ${standard.unit}`;
  
  // Format summaries
  const periodSummary = `${currentTotalFormatted} / ${targetValueFormatted} ${unit}`;
  
  const sessionLabelPluralForSummary = targetSessions === 1 
    ? sessionLabel 
    : `${sessionLabel}s`;
  const sessionsSummary = `${currentSessions} / ${targetSessions} ${sessionLabelPluralForSummary}`;

  const statusColors = getStatusColors(theme, status);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}
      onPress={onCardPress}
      activeOpacity={onCardPress ? 0.7 : 1}
      accessibilityRole={onCardPress ? 'button' : undefined}
      accessibilityLabel={onCardPress ? `View details for ${activityName}` : undefined}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.titleBlock}>
            <Text
              style={[styles.activityName, { color: theme.text.primary }]}
              numberOfLines={1}
              accessibilityLabel={`Activity ${activityName}`}
            >
              {activityName}
            </Text>
            <Text
              style={[styles.volumePeriodText, { color: theme.text.primary }]}
              numberOfLines={1}
              accessibilityLabel={`Volume: ${volumePeriodText}`}
            >
              {volumePeriodText}
            </Text>
            <Text
              style={[styles.sessionParamsText, { color: theme.text.secondary }]}
              numberOfLines={1}
              accessibilityLabel={`Session params: ${sessionParamsText}`}
            >
              {sessionParamsText}
            </Text>
            <Text 
              style={[styles.dateLine, { color: theme.text.secondary }]} 
              numberOfLines={1}
              accessibilityLabel={`Period: ${periodLabel}`}
            >
              {periodLabel}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.actionButtonsRow}>
              {onEdit && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  style={[styles.iconButton, { backgroundColor: theme.button.icon.background }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${activityName}`}
                >
                  <MaterialIcons name="edit" size={18} color={theme.button.icon.icon} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  style={[styles.iconButton, { backgroundColor: theme.button.icon.background }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${activityName}`}
                >
                  <MaterialIcons name="delete" size={18} color={theme.button.icon.icon} />
                </TouchableOpacity>
              )}
              {showLogButton ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    if (onLogPress) onLogPress();
                  }}
                  style={[styles.logButtonHeader, { backgroundColor: theme.button.primary.background }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Log progress for ${activityName}`}
                >
                  <Text style={[styles.logButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>Log</Text>
                </TouchableOpacity>
              ) : (
                <View
                  style={[styles.statusPill, { backgroundColor: statusColors.background }]}
                  accessibilityRole="text"
                >
                  <Text style={[styles.statusText, { color: statusColors.text }]}>{status}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.progressContainer, { backgroundColor: theme.background.secondary, borderTopColor: theme.border.secondary }]}>
          <View style={[styles.progressBar, { backgroundColor: theme.background.tertiary }]}>
            <View
              style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: progressBarColor }]}
              accessibilityRole="progressbar"
              accessibilityValue={{ now: progressPercent, min: 0, max: 100 }}
            />
          </View>
          <View style={styles.progressSummaries}>
            <Text style={[styles.progressSummaryText, { color: theme.text.secondary }]}>
              {periodSummary}
            </Text>
            <Text style={[styles.progressSummaryText, { color: theme.text.secondary }]}>
              {sessionsSummary}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 0,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: CARD_SPACING,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  volumePeriodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sessionParamsText: {
    fontSize: 13,
  },
  dateLine: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  logButtonHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  logButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
  },
  progressContainer: {
    padding: CARD_SPACING,
    borderTopWidth: 1,
    gap: 12,
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressSummaries: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressSummaryText: {
    fontSize: 12,
  },
});
