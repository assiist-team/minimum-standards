import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { usePeriodLogs } from '../hooks/usePeriodLogs';
import type { PeriodLogEntry } from '../hooks/usePeriodLogs';
import { LogEntryModal } from './LogEntryModal';
import { useStandards } from '../hooks/useStandards';
import type { ActivityLog } from '@minimum-standards/shared-model';
import { useActivities } from '../hooks/useActivities';
import { useTheme } from '../theme/useTheme';
import { BUTTON_BORDER_RADIUS } from '../theme/radius';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface PeriodLogsModalProps {
  visible: boolean;
  standardId: string;
  periodStartMs: number;
  periodEndMs: number;
  periodLabel: string;
  onClose: () => void;
}

function LogItem({
  item,
  theme,
  canEdit,
  onEdit,
  onDelete,
}: {
  item: PeriodLogEntry;
  theme: ReturnType<typeof useTheme>;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const formatDateTime = (timestampMs: number): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestampMs));
  };

  return (
    <View style={[styles.logItem, { backgroundColor: theme.background.tertiary }]}>
      <View style={styles.logHeader}>
        <Text style={[styles.logValue, { color: theme.text.primary }]}>{item.value}</Text>
        <View style={styles.dateContainer}>
          <Text style={[styles.logDate, { color: theme.text.secondary }]}>
            {formatDateTime(item.occurredAtMs)}
          </Text>
          {item.editedAtMs && (
            <Text style={[styles.editedIndicator, { color: theme.text.secondary }]}>
              Edited
            </Text>
          )}
        </View>
      </View>
      {item.note && (
        <Text style={[styles.logNote, { color: theme.text.primary }]}>{item.note}</Text>
      )}
      {canEdit && (
        <View style={styles.logActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.button.icon.background }]}
            onPress={onEdit}
            accessibilityLabel="Edit log entry"
            accessibilityRole="button"
          >
            <MaterialIcons name="edit" size={20} color={theme.button.icon.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, { backgroundColor: theme.button.icon.background }]}
            onPress={onDelete}
            accessibilityLabel="Delete log entry"
            accessibilityRole="button"
          >
            <MaterialIcons name="delete" size={20} color={theme.button.icon.icon} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const LogSeparator = () => <View style={styles.separator} />;

export function PeriodLogsModal({
  visible,
  standardId,
  periodStartMs,
  periodEndMs,
  periodLabel,
  onClose,
}: PeriodLogsModalProps) {
  const theme = useTheme();
  const { logs, loading, error } = usePeriodLogs(standardId, periodStartMs, periodEndMs);
  const { standards, updateLogEntry, deleteLogEntry, restoreLogEntry, canLogStandard } = useStandards();
  const { allActivities } = useActivities();
  
  const [editingLogEntry, setEditingLogEntry] = useState<ActivityLog | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [undoLogEntry, setUndoLogEntry] = useState<PeriodLogEntry | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const standard = standards.find((s) => s.id === standardId);
  const canEdit = standard ? canLogStandard(standardId) : false;
  const activityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allActivities.forEach((activity) => {
      map.set(activity.id, activity.name);
    });
    return map;
  }, [allActivities]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const scheduleUndoClear = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = setTimeout(() => {
      setUndoLogEntry(null);
      undoTimerRef.current = null;
    }, 5000);
  }, []);

  const handleEditPress = useCallback((item: PeriodLogEntry) => {
    const activityLog: ActivityLog = {
      id: item.id,
      standardId: standardId,
      value: item.value,
      occurredAtMs: item.occurredAtMs,
      note: item.note,
      editedAtMs: item.editedAtMs,
      createdAtMs: 0, // Not needed for edit
      updatedAtMs: 0, // Not needed for edit
      deletedAtMs: null,
    };
    setEditingLogEntry(activityLog);
    setEditModalVisible(true);
  }, [standardId]);

  const handleDeletePress = useCallback((item: PeriodLogEntry) => {
    Alert.alert(
      'Delete Log Entry',
      'Are you sure you want to delete this log entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLogEntry(item.id, standardId);
              setUndoLogEntry(item);
              scheduleUndoClear();
            } catch {
              Alert.alert('Error', 'Failed to delete log entry');
            }
          },
        },
      ]
    );
  }, [deleteLogEntry, standardId, scheduleUndoClear]);

  const handleUndoDelete = useCallback(async () => {
    if (!undoLogEntry) {
      return;
    }

    try {
      await restoreLogEntry(undoLogEntry.id, standardId);
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      setUndoLogEntry(null);
    } catch {
      Alert.alert('Error', 'Failed to restore log entry');
    }
  }, [undoLogEntry, restoreLogEntry, standardId]);

  const handleEditSave = useCallback(
    async (logStandardId: string, value: number, occurredAtMs: number, note?: string | null, logEntryId?: string) => {
      if (logEntryId && updateLogEntry) {
        await updateLogEntry({ logEntryId, standardId: logStandardId, value, occurredAtMs, note });
      }
      setEditModalVisible(false);
      setEditingLogEntry(null);
    },
    [updateLogEntry]
  );

  const handleEditModalClose = useCallback(() => {
    setEditModalVisible(false);
    setEditingLogEntry(null);
  }, []);

  const renderItem = ({ item }: { item: PeriodLogEntry }) => (
    <LogItem
      item={item}
      theme={theme}
      canEdit={canEdit}
      onEdit={() => handleEditPress(item)}
      onDelete={() => handleDeletePress(item)}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.background.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.background.modal }]}>
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                {periodLabel}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.text.secondary }]}>
                Logs
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <Text style={[styles.closeButton, { color: theme.text.secondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer} testID="logs-loading">
                <ActivityIndicator size="large" color={theme.primary.main} />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.status.missed.text }]}>
                  {error.message || 'Failed to load logs'}
                </Text>
              </View>
            ) : logs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
                  No logs found for this period
                </Text>
              </View>
            ) : (
              <FlatList
                data={logs}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.logsList}
                ItemSeparatorComponent={LogSeparator}
              />
            )}
          </View>
        </View>

        {/* Undo snackbar */}
        {undoLogEntry && (
          <View style={[styles.snackbar, { backgroundColor: theme.background.tertiary, shadowColor: theme.shadow }]}>
            <Text style={[styles.snackbarText, { color: theme.text.inverse }]}>Log entry deleted</Text>
            <TouchableOpacity onPress={handleUndoDelete}>
              <Text style={[styles.snackbarAction, { color: theme.primary.light }]}>Undo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Edit modal */}
      <LogEntryModal
        visible={editModalVisible}
        standard={standard || undefined}
        logEntry={editingLogEntry || undefined}
        onClose={handleEditModalClose}
        onSave={handleEditSave}
        resolveActivityName={(activityId) => activityNameMap.get(activityId)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  logsList: {
    paddingBottom: 20,
  },
  logItem: {
    borderRadius: 8,
    padding: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  logDate: {
    fontSize: 14,
  },
  logNote: {
    fontSize: 14,
    marginTop: 4,
  },
  separator: {
    height: 8,
  },
  dateContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  editedIndicator: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  logActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {},
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  snackbarText: {
    fontSize: 14,
  },
  snackbarAction: {
    fontWeight: '600',
    fontSize: 14,
  },
});
