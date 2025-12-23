import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Dimensions,
} from 'react-native';
import type { Standard } from '@minimum-standards/shared-model';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/useTheme';
import { getStatusColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { BUTTON_BORDER_RADIUS } from '../theme/radius';

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
  onDeactivate?: () => void;
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
  onDeactivate,
}: StandardProgressCardProps) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuButtonLayout, setMenuButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const menuButtonRef = useRef<View>(null);
  
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

  const handleLogPress = useCallback((e: any) => {
    e.stopPropagation();
    if (onLogPress) onLogPress();
  }, [onLogPress]);

  const handleMenuPress = useCallback((e: any) => {
    e.stopPropagation();
    // Measure button position when opening menu
    menuButtonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMenuButtonLayout({ x, y, width, height });
      setMenuVisible(true);
    });
  }, []);

  const handleEditPress = useCallback(() => {
    setMenuVisible(false);
    if (onEdit) onEdit();
  }, [onEdit]);

  const handleDeletePress = useCallback(() => {
    setMenuVisible(false);
    if (onDelete) onDelete();
  }, [onDelete]);

  const handleDeactivatePress = useCallback(() => {
    setMenuVisible(false);
    if (onDeactivate) onDeactivate();
  }, [onDeactivate]);

  // Determine if we should show the menu (if we have Edit, Delete, or Deactivate)
  const showMenu = onEdit || onDelete || onDeactivate;

  return (
    <>
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
                {showLogButton ? (
                  <TouchableOpacity
                    onPress={handleLogPress}
                    style={[
                      styles.logButtonHeader,
                      {
                        backgroundColor: theme.button.primary.background,
                        width: 50,
                        height: 30,
                      },
                    ]}
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
                {showMenu && (
                  <View ref={menuButtonRef}>
                    <TouchableOpacity
                      onPress={handleMenuPress}
                      style={styles.menuButton}
                      accessibilityRole="button"
                      accessibilityLabel={`More options for ${activityName}`}
                    >
                      <MaterialIcons name="more-vert" size={20} color={theme.button.icon.icon} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

        <View style={[styles.progressContainer, { backgroundColor: theme.background.card, borderTopColor: theme.border.secondary }]}>
          <View style={[styles.progressBar, { backgroundColor: theme.border.secondary }]}>
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

    <Modal
      visible={menuVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setMenuVisible(false)}
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={() => setMenuVisible(false)}
      >
        {menuButtonLayout && (() => {
          const screenWidth = Dimensions.get('window').width;
          const menuWidth = 200;
          const buttonRightEdge = menuButtonLayout.x + menuButtonLayout.width;
          // Align menu's right edge with button's right edge
          let menuLeft = buttonRightEdge - menuWidth;
          // Ensure menu doesn't go off the left or right edge of screen
          menuLeft = Math.max(16, Math.min(menuLeft, screenWidth - menuWidth - 16));
          
          return (
            <View
              style={[
                styles.menuContainer,
                {
                  backgroundColor: theme.background.modal,
                  top: menuButtonLayout.y + menuButtonLayout.height + 4,
                  left: menuLeft,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              {onEdit && (
                <TouchableOpacity
                  onPress={handleEditPress}
                  style={[styles.menuItem, { borderBottomColor: theme.border.secondary }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${activityName}`}
                >
                  <MaterialIcons name="edit" size={20} color={theme.button.icon.icon} />
                  <Text style={[styles.menuItemText, { color: theme.button.icon.icon }]}>Edit</Text>
                </TouchableOpacity>
              )}
              {onDeactivate && (
                <TouchableOpacity
                  onPress={handleDeactivatePress}
                  style={onDelete ? [styles.menuItem, { borderBottomColor: theme.border.secondary }] : [styles.menuItem, { borderBottomWidth: 0 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Deactivate ${activityName}`}
                >
                  <MaterialIcons name="toggle-off" size={20} color={theme.button.icon.icon} />
                  <Text style={[styles.menuItemText, { color: theme.button.icon.icon }]}>Deactivate</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={handleDeletePress}
                  style={[styles.menuItem, { borderBottomWidth: 0 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${activityName}`}
                >
                  <MaterialIcons name="delete" size={20} color={theme.button.icon.icon} />
                  <Text style={[styles.menuItemText, { color: theme.button.icon.icon }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })()}
      </TouchableOpacity>
    </Modal>
    </>
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
    gap: 12,
    alignItems: 'center',
  },
  logButtonHeader: {
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  menuButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    borderRadius: 12,
    minWidth: 200,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
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
