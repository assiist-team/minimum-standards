import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ToastAndroid,
  Alert,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Standard, ActivityLog } from '@minimum-standards/shared-model';
import { useStandards } from '../hooks/useStandards';

export interface LogEntryModalProps {
  visible: boolean;
  standard: Standard | null | undefined;
  logEntry?: ActivityLog | null; // Optional log entry for edit mode
  onClose: () => void;
  onSave: (standardId: string, value: number, occurredAtMs: number, note?: string | null, logEntryId?: string) => Promise<void>;
}

export function LogEntryModal({
  visible,
  standard,
  logEntry,
  onClose,
  onSave,
}: LogEntryModalProps) {
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [showWhen, setShowWhen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(standard || null);
  
  const { activeStandards, loading: standardsLoading } = useStandards();

  const isEditMode = !!logEntry;

  // Determine if we should show the picker (when standard prop is null/undefined and no standard has been selected)
  const showPicker = (standard === null || standard === undefined) && selectedStandard === null;

  useEffect(() => {
    if (visible) {
      if (logEntry) {
        // Edit mode: pre-fill form from logEntry
        setValue(String(logEntry.value));
        setNote(logEntry.note || '');
        setShowNote(!!logEntry.note);
        setShowWhen(true);
        setSelectedDate(new Date(logEntry.occurredAtMs));
        setSelectedStandard(standard || null);
      } else {
        // Create mode: reset all form state
        setValue('');
        setNote('');
        setShowNote(false);
        setShowWhen(false);
        setSelectedDate(new Date());
        setSelectedStandard(standard || null);
      }
      setSaveError(null);
    }
  }, [visible, standard, logEntry]);

  const handleStandardSelect = (selected: Standard) => {
    setSelectedStandard(selected);
  };

  const handleSave = async () => {
    const targetStandard = selectedStandard;
    if (!targetStandard) {
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setSaveError('Please enter a valid number (zero or greater)');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const occurredAtMs = selectedDate.getTime();
      await onSave(
        targetStandard.id,
        numValue,
        occurredAtMs,
        note.trim() || null,
        logEntry?.id // Pass logEntryId in edit mode
      );
      
      // Show success confirmation
      const successMessage = isEditMode ? 'Log updated' : 'Log submitted';
      if (Platform.OS === 'android') {
        ToastAndroid.show(successMessage, ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', successMessage);
      }

      // Reset form and close
      setValue('');
      setNote('');
      setShowNote(false);
      setShowWhen(false);
      setSelectedDate(new Date());
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError('Failed to save log entry');
      }
    } finally {
      setSaving(false);
    }
  };

  const buildDefaultQuickAddValues = (targetStandard: Standard): number[] | undefined => {
    const normalizedUnit = targetStandard.unit.trim().toLowerCase();
    const countLikeUnits = new Set([
      'session',
      'sessions',
      'call',
      'calls',
      'workout',
      'workouts',
      'rep',
      'reps',
      'time',
      'times',
      'pomodoro',
      'pomodoros',
    ]);

    if (countLikeUnits.has(normalizedUnit) || targetStandard.minimum <= 10) {
      return [1];
    }

    return undefined;
  };

  const quickAddValues =
    selectedStandard && Array.isArray(selectedStandard.quickAddValues) && selectedStandard.quickAddValues.length > 0
      ? selectedStandard.quickAddValues
      : selectedStandard
        ? buildDefaultQuickAddValues(selectedStandard)
        : undefined;

  const handleQuickAddPress = (quickValue: number) => {
    if (saving) {
      return;
    }
    setValue(String(quickValue));
    if (saveError) {
      setSaveError(null);
    }
  };

  const handleClose = () => {
    if (saving) {
      return;
    }
    setValue('');
    setNote('');
    setShowNote(false);
    setShowWhen(false);
    setSelectedDate(new Date());
    setSaveError(null);
    setSelectedStandard(null);
    onClose();
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const handleNowPress = () => {
    setSelectedDate(new Date());
  };

  const renderStandardPicker = () => {
    if (standardsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F62FE" />
        </View>
      );
    }

    if (activeStandards.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No active standards. Create one in Standards Builder.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={activeStandards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.standardItem}
            onPress={() => handleStandardSelect(item)}
            accessibilityLabel={`Select standard ${item.summary}`}
            accessibilityRole="button"
          >
            <Text style={styles.standardItemText}>{item.summary}</Text>
          </TouchableOpacity>
        )}
        style={styles.standardsList}
      />
    );
  };

  const renderLoggingForm = () => {
    if (!selectedStandard) {
      return null;
    }

    return (
      <>
        <View style={styles.field}>
          <Text style={styles.label}>Value ({selectedStandard.unit})</Text>
          {quickAddValues && quickAddValues.length > 0 && (
            <View style={styles.quickAddRow}>
              {quickAddValues.map((quickValue) => (
                <TouchableOpacity
                  key={String(quickValue)}
                  style={styles.quickAddChip}
                  onPress={() => handleQuickAddPress(quickValue)}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel={`Quick add ${quickValue}`}
                >
                  <Text style={styles.quickAddChipText}>{`+${quickValue}`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TextInput
            style={[styles.input, styles.valueInput, saveError && styles.inputError]}
            value={value}
            onChangeText={(text) => {
              setValue(text);
              if (saveError) {
                setSaveError(null);
              }
            }}
            placeholder="0"
            keyboardType="numeric"
            editable={!saving}
            autoFocus={true}
            accessibilityLabel={`Enter value in ${selectedStandard.unit}`}
          />
          {saveError && <Text style={styles.errorText}>{saveError}</Text>}
        </View>

        {!showNote && (
          <TouchableOpacity
            onPress={() => setShowNote(true)}
            style={styles.addNoteButton}
            disabled={saving}
            accessibilityLabel="Add optional note"
            accessibilityRole="button"
          >
            <Text style={styles.addNoteText}>+ Add note (optional)</Text>
          </TouchableOpacity>
        )}

        {showNote && (
          <View style={styles.field}>
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="e.g., Morning session"
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!saving}
              accessibilityLabel="Enter optional note"
            />
            <TouchableOpacity
              onPress={() => {
                setShowNote(false);
                setNote('');
              }}
              style={styles.removeNoteButton}
              disabled={saving}
              accessibilityLabel="Remove note"
              accessibilityRole="button"
            >
              <Text style={styles.removeNoteText}>Remove note</Text>
            </TouchableOpacity>
          </View>
        )}

        {!showWhen && (
          <TouchableOpacity
            onPress={() => setShowWhen(true)}
            style={styles.addNoteButton}
            disabled={saving}
            accessibilityLabel="Select when this activity occurred"
            accessibilityRole="button"
          >
            <Text style={styles.addNoteText}>+ When?</Text>
          </TouchableOpacity>
        )}

        {showWhen && (
          <View style={styles.field}>
            <View style={styles.whenHeader}>
              <Text style={styles.label}>When?</Text>
              <TouchableOpacity
                onPress={handleNowPress}
                style={styles.nowButton}
                disabled={saving}
                accessibilityLabel="Set to current time"
                accessibilityRole="button"
              >
                <Text style={styles.nowButtonText}>Now</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={selectedDate}
                mode="datetime"
                display="spinner"
                onChange={(event, date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                style={styles.datePicker}
                accessibilityLabel="Select date and time"
              />
            ) : (
              <DateTimePicker
                value={selectedDate}
                mode="datetime"
                display="default"
                onChange={(event, date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                  if (event.type === 'set') {
                    setShowWhen(false);
                  }
                }}
                accessibilityLabel="Select date and time"
              />
            )}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={() => setShowWhen(false)}
                style={styles.removeNoteButton}
                disabled={saving}
                accessibilityLabel="Collapse date picker"
                accessibilityRole="button"
              >
                <Text style={styles.removeNoteText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || !value.trim()}
          accessibilityLabel="Save log entry"
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.modalTitle}>
                {showPicker
                  ? 'Select Standard'
                  : isEditMode
                  ? 'Edit Log'
                  : 'Log Activity'}
              </Text>
              {selectedStandard && !showPicker && (
                <Text style={styles.standardSummary} numberOfLines={1}>
                  {selectedStandard.summary}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              onPress={handleClose} 
              disabled={saving}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {showPicker ? renderStandardPicker() : renderLoggingForm()}
          </View>
        </View>
      </View>
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
  standardSummary: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  form: {
    gap: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  valueInput: {
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
  },
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  quickAddChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#c9d7ff',
  },
  quickAddChipText: {
    color: '#0F62FE',
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  addNoteButton: {
    paddingVertical: 12,
  },
  addNoteText: {
    color: '#0F62FE',
    fontSize: 14,
  },
  removeNoteButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  removeNoteText: {
    color: '#666',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#0F62FE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  standardsList: {
    maxHeight: 400,
  },
  standardItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 44,
    justifyContent: 'center',
  },
  standardItemText: {
    fontSize: 16,
    color: '#333',
  },
  whenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  nowButtonText: {
    fontSize: 14,
    color: '#0F62FE',
    fontWeight: '600',
  },
  selectedDateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  datePicker: {
    height: 200,
  },
});
