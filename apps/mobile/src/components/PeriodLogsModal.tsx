import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { usePeriodLogs } from '../hooks/usePeriodLogs';
import type { PeriodLogEntry } from '../hooks/usePeriodLogs';
import { LogEntryModal } from './LogEntryModal';
import { useStandards } from '../hooks/useStandards';
import type { Standard, ActivityLog } from '@minimum-standards/shared-model';

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
  isDark,
  canEdit,
  onEdit,
  onDelete,
}: {
  item: PeriodLogEntry;
  isDark: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const formatDateTime = (timestampMs: number): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestampMs));
  };

  return (
    <View style={[styles.logItem, isDark && styles.logItemDark]}>
      <View style={styles.logHeader}>
        <Text style={[styles.logValue, isDark && styles.logValueDark]}>{item.value}</Text>
        <View style={styles.dateContainer}>
          <Text style={[styles.logDate, isDark && styles.logDateDark]}>
            {formatDateTime(item.occurredAtMs)}
          </Text>
          {item.editedAtMs && (
            <Text style={[styles.editedIndicator, isDark && styles.editedIndicatorDark]}>
              Edited
            </Text>
          )}
        </View>
      </View>
      {item.note && (
        <Text style={[styles.logNote, isDark && styles.logNoteDark]}>{item.note}</Text>
      )}
      {canEdit && (
        <View style={styles.logActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
            accessibilityLabel="Edit log entry"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={onDelete}
            accessibilityLabel="Delete log entry"
            accessibilityRole="button"
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
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
  const isDark = useColorScheme() === 'dark';
  const { logs, loading, error } = usePeriodLogs(standardId, periodStartMs, periodEndMs);
  const { standards, updateLogEntry, deleteLogEntry, restoreLogEntry, canLogStandard } = useStandards();
  
  const [editingLogEntry, setEditingLogEntry] = useState<ActivityLog | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [undoLogEntry, setUndoLogEntry] = useState<PeriodLogEntry | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const standard = standards.find((s) => s.id === standardId);
  const canEdit = standard ? canLogStandard(standardId) : false;

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
            } catch (err) {
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
    } catch (err) {
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
      isDark={isDark}
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
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                {periodLabel}
              </Text>
              <Text style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
                Logs
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <Text style={[styles.closeButton, isDark && styles.closeButtonDark]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer} testID="logs-loading">
                <ActivityIndicator size="large" color="#0F62FE" />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
                  {error.message || 'Failed to load logs'}
                </Text>
              </View>
            ) : logs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
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
          <View style={styles.snackbar}>
            <Text style={styles.snackbarText}>Log entry deleted</Text>
            <TouchableOpacity onPress={handleUndoDelete}>
              <Text style={styles.snackbarAction}>Undo</Text>
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
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalContentDark: {
    backgroundColor: '#1E1E1E',
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
    color: '#111',
    marginBottom: 4,
  },
  modalTitleDark: {
    color: '#E0E0E0',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  modalSubtitleDark: {
    color: '#B0B0B0',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  closeButtonDark: {
    color: '#B0B0B0',
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
    color: '#C5221F',
    fontSize: 14,
    textAlign: 'center',
  },
  errorTextDark: {
    color: '#EF5350',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#B0B0B0',
  },
  logsList: {
    paddingBottom: 20,
  },
  logItem: {
    backgroundColor: '#f7f8fa',
    borderRadius: 8,
    padding: 12,
  },
  logItemDark: {
    backgroundColor: '#2E2E2E',
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
    color: '#0E1116',
  },
  logValueDark: {
    color: '#E0E0E0',
  },
  logDate: {
    fontSize: 14,
    color: '#666',
  },
  logDateDark: {
    color: '#B0B0B0',
  },
  logNote: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  logNoteDark: {
    color: '#D0D0D0',
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
    color: '#666',
    fontStyle: 'italic',
  },
  editedIndicatorDark: {
    color: '#B0B0B0',
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
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#0F62FE',
  },
  deleteButtonText: {
    color: '#d32f2f',
  },
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#323232',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  snackbarText: {
    color: '#fff',
    fontSize: 14,
  },
  snackbarAction: {
    color: '#4DBAF7',
    fontWeight: '600',
    fontSize: 14,
  },
});
