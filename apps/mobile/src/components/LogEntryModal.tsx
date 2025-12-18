import React, { useMemo, useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Standard, ActivityLog } from '@minimum-standards/shared-model';
import { useStandards } from '../hooks/useStandards';
import { useTheme } from '../theme/useTheme';
import { BUTTON_BORDER_RADIUS } from '../theme/radius';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface LogEntryModalProps {
  visible: boolean;
  standard: Standard | null | undefined;
  logEntry?: ActivityLog | null; // Optional log entry for edit mode
  onClose: () => void;
  onSave: (standardId: string, value: number, occurredAtMs: number, note?: string | null, logEntryId?: string) => Promise<void>;
  onCreateStandard?: () => void; // Callback to create a new standard from empty state
  resolveActivityName?: (activityId: string) => string | undefined;
}

export function LogEntryModal({
  visible,
  standard,
  logEntry,
  onClose,
  onSave,
  onCreateStandard,
  resolveActivityName,
}: LogEntryModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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

  const isSessionBased = !!selectedStandard && selectedStandard.sessionConfig.sessionsPerCadence > 1;
  const sessionLabel = selectedStandard?.sessionConfig.sessionLabel ?? 'session';
  const sessionLabelPlural = useMemo(() => {
    if (!selectedStandard) {
      return 'sessions';
    }
    const count = selectedStandard.sessionConfig.sessionsPerCadence;
    if (count === 1) {
      return sessionLabel;
    }
    return `${sessionLabel}s`;
  }, [selectedStandard, sessionLabel]);

  const activityName = useMemo(() => {
    if (!selectedStandard || showPicker) {
      return null;
    }
    const resolved = resolveActivityName?.(selectedStandard.activityId);
    return resolved ?? selectedStandard.activityId;
  }, [resolveActivityName, selectedStandard, showPicker]);

  useEffect(() => {
    if (visible) {
      if (logEntry) {
        // Edit mode: pre-fill form from logEntry
        setValue(String(logEntry.value));
        setNote(logEntry.note || '');
        setShowNote(!!logEntry.note);
        // Keep date visible, but don't force the picker open.
        setShowWhen(false);
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

  const handleToggleNote = () => {
    if (saving) {
      return;
    }
    setShowNote((prev) => {
      const next = !prev;
      if (!next) {
        setNote('');
      }
      return next;
    });
  };

  const handleToggleWhen = () => {
    if (saving) {
      return;
    }
    setShowWhen((prev) => !prev);
  };

  const renderStandardPicker = () => {
    if (standardsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary.main} />
        </View>
      );
    }

    if (activeStandards.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.text.primary }]}>
            No active standards yet.
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.text.secondary }]}>
            Create a standard to start logging your progress.
          </Text>
          {onCreateStandard && (
            <TouchableOpacity
              style={[styles.createStandardButton, { backgroundColor: theme.button.primary.background }]}
              onPress={() => {
                onClose();
                onCreateStandard();
              }}
              accessibilityLabel="Create a new standard"
              accessibilityRole="button"
            >
              <Text style={[styles.createStandardButtonText, { color: theme.button.primary.text }]}>Create Standard</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={activeStandards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.standardItem, { borderBottomColor: theme.divider }]}
            onPress={() => handleStandardSelect(item)}
            accessibilityLabel={`Select standard ${item.summary}`}
            accessibilityRole="button"
          >
            <Text style={[styles.standardItemText, { color: theme.text.primary }]}>{item.summary}</Text>
          </TouchableOpacity>
        )}
        style={styles.standardsList}
        contentContainerStyle={styles.standardsListContent}
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
          <View style={styles.valueHeaderRow}>
            <Text style={[styles.label, { color: theme.text.primary }]}>{selectedStandard.unit}</Text>
            {isSessionBased && (
              <Text style={[styles.helperText, { color: theme.text.secondary }]} numberOfLines={1}>
                {`${selectedStandard.sessionConfig.sessionsPerCadence} ${sessionLabelPlural} • ${selectedStandard.sessionConfig.volumePerSession} ${selectedStandard.unit} each`}
              </Text>
            )}
          </View>
          {quickAddValues && quickAddValues.length > 0 && (
            <View style={styles.quickAddRow}>
              {quickAddValues.map((quickValue) => (
                <TouchableOpacity
                  key={String(quickValue)}
                  style={[styles.quickAddChip, { backgroundColor: theme.background.tertiary, borderColor: theme.border.primary }]}
                  onPress={() => handleQuickAddPress(quickValue)}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel={`Quick add ${quickValue}`}
                >
                  <Text style={[styles.quickAddChipText, { color: theme.primary.main }]}>{`+${quickValue}`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TextInput
            style={[
              styles.input,
              styles.valueInput,
              { backgroundColor: theme.input.background, borderColor: saveError ? theme.input.borderError : theme.input.border, color: theme.input.text },
              saveError && styles.inputError
            ]}
            value={value}
            onChangeText={(text) => {
              setValue(text);
              if (saveError) {
                setSaveError(null);
              }
            }}
            placeholder="0"
            placeholderTextColor={theme.input.placeholder}
            keyboardType="numeric"
            editable={!saving}
            autoFocus={true}
            accessibilityLabel={`Enter ${selectedStandard.unit}`}
          />
          {saveError && <Text style={[styles.errorText, { color: theme.input.borderError }]}>{saveError}</Text>}
        </View>

        <View style={styles.metaRow}>
          <TouchableOpacity
            onPress={handleToggleNote}
            style={[styles.metaChip, { backgroundColor: theme.background.tertiary, borderColor: theme.border.primary }]}
            disabled={saving}
            accessibilityLabel={showNote ? 'Hide note' : 'Add a note'}
            accessibilityRole="button"
          >
            <Text style={[styles.metaChipTitle, { color: theme.text.primary }]}>Note</Text>
            <Text
              style={[styles.metaChipValue, { color: note ? theme.text.primary : theme.text.secondary }]}
              numberOfLines={1}
            >
              {note ? note : 'Optional'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleWhen}
            style={[styles.metaChip, { backgroundColor: theme.background.tertiary, borderColor: theme.border.primary }]}
            disabled={saving}
            accessibilityLabel={showWhen ? 'Hide date picker' : 'Change when this occurred'}
            accessibilityRole="button"
          >
            <Text style={[styles.metaChipTitle, { color: theme.text.primary }]}>When</Text>
            <Text style={[styles.metaChipValue, { color: theme.text.primary }]} numberOfLines={1}>
              {formatDate(selectedDate)}
            </Text>
          </TouchableOpacity>
        </View>

        {showNote && (
          <View style={styles.field}>
            <TextInput
              style={[styles.input, styles.noteInput, { backgroundColor: theme.input.background, borderColor: theme.input.border, color: theme.input.text }]}
              value={note}
              onChangeText={setNote}
              placeholder={isSessionBased ? `e.g., ${sessionLabel} notes` : 'Optional note'}
              placeholderTextColor={theme.input.placeholder}
              multiline
              numberOfLines={2}
              maxLength={500}
              editable={!saving}
              accessibilityLabel="Enter optional note"
            />
          </View>
        )}

        {showWhen && (
          <View style={styles.field}>
            <View style={styles.whenHeader}>
              <Text style={[styles.label, { color: theme.text.primary }]}>When</Text>
              <TouchableOpacity
                onPress={handleNowPress}
                style={[styles.nowButton, { backgroundColor: theme.button.secondary.background }]}
                disabled={saving}
                accessibilityLabel="Set to current time"
                accessibilityRole="button"
              >
                <Text style={[styles.nowButtonText, { color: theme.primary.main }]}>Now</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'compact' : 'default'}
              onChange={(event, date) => {
                if (date) {
                  setSelectedDate(date);
                }
                if (Platform.OS !== 'ios' && event.type === 'set') {
                  setShowWhen(false);
                }
              }}
              accessibilityLabel="Select date and time"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={() => setShowWhen(false)}
                style={styles.doneButton}
                disabled={saving}
                accessibilityLabel="Done"
                accessibilityRole="button"
              >
                <Text style={[styles.doneButtonText, { color: theme.primary.main }]}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    );
  };

  const handleOverlayPress = () => {
    Keyboard.dismiss();
  };

  const renderFooter = () => {
    if (showPicker || !selectedStandard) {
      return null;
    }

    return (
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.background.modal,
            borderTopColor: theme.border.secondary,
            paddingBottom: 12 + insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: saving ? theme.button.disabled.background : theme.button.primary.background },
          ]}
          onPress={handleSave}
          disabled={saving || !value.trim()}
          accessibilityLabel="Save log entry"
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color={theme.button.primary.text} />
          ) : (
            <Text style={[styles.saveButtonText, { color: theme.button.primary.text }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.background.overlay }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleOverlayPress}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.bottom}
          style={styles.keyboardAvoider}
        >
          <View
            onStartShouldSetResponder={() => true}
            style={[
              styles.modalContent,
              { backgroundColor: theme.background.modal },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.headerContent}>
                <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                  {showPicker
                    ? 'Select Standard'
                    : isEditMode
                    ? `Edit ${activityName ?? 'Activity'}`
                    : `Log ${activityName ?? 'Activity'}`}
                </Text>
                {selectedStandard && !showPicker && (
                  <Text style={[styles.standardSummary, { color: theme.text.secondary }]} numberOfLines={1}>
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
                <Text style={[styles.closeButton, { color: theme.text.secondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {showPicker ? (
              <View style={styles.pickerContainer}>
                {renderStandardPicker()}
              </View>
            ) : (
              <ScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.form}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={true}
              >
                {renderLoggingForm()}
              </ScrollView>
            )}

            {renderFooter()}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoider: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
    maxHeight: '90%',
    width: '100%',
  },
  pickerContainer: {
    maxHeight: 420,
  },
  formScroll: {
    flexGrow: 0,
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
  standardSummary: {
    fontSize: 14,
  },
  closeButton: {
    fontSize: 24,
  },
  form: {
    gap: 16,
    paddingBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 0,
  },
  valueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    borderWidth: 1,
  },
  quickAddChipText: {
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  inputError: {},
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    minHeight: 56,
  },
  metaChipTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaChipValue: {
    fontSize: 13,
  },
  saveButton: {
    padding: 16,
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  createStandardButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BUTTON_BORDER_RADIUS,
    marginTop: 8,
  },
  createStandardButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  standardsList: {
    flexGrow: 1,
  },
  standardsListContent: {
    paddingVertical: 8,
  },
  standardItem: {
    padding: 16,
    borderBottomWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  standardItemText: {
    fontSize: 16,
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
    borderRadius: BUTTON_BORDER_RADIUS,
  },
  nowButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
