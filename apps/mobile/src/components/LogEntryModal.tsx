import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  ScrollView,
  Keyboard,
  KeyboardEvent,
  LayoutChangeEvent,
  InteractionManager,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Standard } from '@minimum-standards/shared-model';
import { useStandards } from '../hooks/useStandards';
import { useTheme } from '../theme/useTheme';
import { BUTTON_BORDER_RADIUS } from '../theme/radius';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StandardCard } from './StandardCard';

export interface EditLogEntry {
  id: string;
  value: number;
  occurredAtMs: number;
  note: string | null;
}

export interface LogEntryModalProps {
  visible: boolean;
  standard: Standard | null | undefined;
  logEntry?: EditLogEntry | null; // Optional log entry for edit mode
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
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const valueInputRef = useRef<TextInput>(null);

  const { activeStandards, loading: standardsLoading } = useStandards();

  const isEditMode = !!logEntry;

  // Determine if we should show the picker (when no standard is currently selected)
  const showPicker = selectedStandard === null;

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

  const effectiveKeyboardHeight = Math.max(0, keyboardHeight - insets.bottom);

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes so a new session always starts fresh
      setSelectedStandard(null);
      setValue('');
      setNote('');
      setShowNote(false);
      setShowWhen(false);
      setSelectedDate(new Date());
      setSaveError(null);
      return;
    }

    if (logEntry) {
      // Edit mode: pre-fill form from logEntry
      setValue(String(logEntry.value));
      setNote(logEntry.note || '');
      setShowNote(!!logEntry.note);
      // Keep date visible, but don't force the picker open.
      setShowWhen(false);
      setSelectedDate(new Date(logEntry.occurredAtMs));
      setSelectedStandard(standard ?? null);
    } else {
      // Create mode: reset all form state
      setValue('');
      setNote('');
      setShowNote(false);
      setShowWhen(false);
      setSelectedDate(new Date());
      setSelectedStandard(standard ?? null);
    }
    setSaveError(null);
  }, [visible, standard, logEntry]);

  // Auto-focus the value input when entering the logging form
  useEffect(() => {
    if (visible && selectedStandard && !showPicker && !isEditMode) {
      // Delay focus until layout/animations settle (Android needs extra time).
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const task = InteractionManager.runAfterInteractions(() => {
        timeoutId = setTimeout(() => {
          valueInputRef.current?.focus();
        }, Platform.OS === 'android' ? 250 : 100);
      });
      return () => {
        task.cancel();
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [visible, selectedStandard, showPicker, isEditMode]);


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

  const sessionQuickFillValue = useMemo(() => {
    if (!selectedStandard) {
      return null;
    }
    if (selectedStandard.sessionConfig.sessionsPerCadence <= 1) {
      return null;
    }
    const v = selectedStandard.sessionConfig.volumePerSession;
    return Number.isFinite(v) && v > 0 ? v : null;
  }, [selectedStandard]);

  // Only show the session-based quick add button (no +1 quick add values).
  const quickAddValuesToShow: number[] | undefined = undefined;

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
      month: '2-digit',
      day: '2-digit',
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
    console.log('[LogEntryModal] renderStandardPicker - standardsLoading=', standardsLoading, 'activeStandards.length=', activeStandards.length);
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
          <StandardCard
            standard={item}
            onSelect={() => handleStandardSelect(item)}
            activityNameMap={new Map([[item.activityId, resolveActivityName?.(item.activityId) ?? item.activityId]])}
            showActions={false}
          />
        )}
        style={styles.standardsList}
        contentContainerStyle={styles.standardsListContent}
      />
    );
  };

  useEffect(() => {
    console.log('[LogEntryModal] useEffect(visible,standard,logEntry) ->', {
      visible,
      incomingStandardId: standard ? standard.id : null,
      selectedStandardBefore: selectedStandard ? selectedStandard.id : null,
      logEntryId: logEntry ? logEntry.id : null,
    });
  }, [visible, standard, logEntry]);

  useEffect(() => {
    console.log('[LogEntryModal] selectedStandard changed ->', {
      selectedStandardId: selectedStandard ? selectedStandard.id : null,
      showPicker: selectedStandard === null,
    });
  }, [selectedStandard]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const renderLoggingForm = () => {
    if (!selectedStandard) {
      return null;
    }

    const hasQuickButtons = sessionQuickFillValue !== null;

    return (
      <>
        {/* Value Input Section */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text.primary }]}>{selectedStandard.unit}</Text>
          
          <View style={styles.valueInputRow}>
            <TextInput
              ref={valueInputRef}
              style={[
                styles.input,
                styles.valueInput,
                hasQuickButtons && styles.valueInputWithButtons,
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
              onPressIn={() => valueInputRef.current?.focus()}
              placeholder=""
              placeholderTextColor={theme.input.placeholder}
              keyboardType={Platform.OS === 'android' ? 'number-pad' : 'numeric'}
              editable={!saving}
              autoFocus={Platform.OS === 'android' && !isEditMode}
              showSoftInputOnFocus={true}
              accessibilityLabel={`Enter ${selectedStandard.unit}`}
            />
            
            {/* Quick-add buttons next to input */}
            {hasQuickButtons && (
              <View style={styles.quickButtonsColumn}>
                {sessionQuickFillValue !== null && (
                  <TouchableOpacity
                    onPress={() => handleQuickAddPress(sessionQuickFillValue)}
                    disabled={saving}
                    style={[
                      styles.compactQuickButton,
                      { backgroundColor: theme.button.primary.background },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Log ${sessionQuickFillValue} ${selectedStandard.unit}`}
                  >
                    <Text style={[styles.compactQuickButtonText, { color: '#FFFFFF' }]}>
                      {sessionQuickFillValue}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          
          {saveError && <Text style={[styles.errorText, { color: theme.input.borderError }]}>{saveError}</Text>}
        </View>

        {/* Simplified When/Note Row */}
        <View style={styles.metaRow}>
          <TouchableOpacity
            onPress={handleToggleWhen}
            style={[styles.compactMetaButton, { backgroundColor: theme.background.tertiary, borderColor: theme.border.primary }]}
            disabled={saving}
            accessibilityLabel="Change when this occurred"
            accessibilityRole="button"
          >
            <Text style={[styles.compactMetaButtonLabel, { color: theme.text.secondary }]}>When</Text>
            <Text style={[styles.compactMetaButtonValue, { color: theme.text.primary }]} numberOfLines={1}>
              {formatDate(selectedDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleNote}
            style={[styles.compactMetaButton, { backgroundColor: theme.background.tertiary, borderColor: theme.border.primary }]}
            disabled={saving}
            accessibilityLabel={showNote ? 'Hide note' : 'Add a note'}
            accessibilityRole="button"
          >
            <Text style={[styles.compactMetaButtonLabel, { color: theme.text.secondary }]}>Note</Text>
            <Text
              style={[styles.compactMetaButtonValue, { color: note ? theme.text.primary : theme.text.secondary }]}
              numberOfLines={1}
            >
              {note ? note : 'Tap to add'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Expandable sections */}
        {showWhen && (
          <View style={[styles.expandedSection, { backgroundColor: theme.background.tertiary, borderColor: theme.border.primary }]}>
            <View style={styles.expandedHeader}>
              <Text style={[styles.expandedHeaderText, { color: theme.text.primary }]}>Select Date & Time</Text>
              <TouchableOpacity
                onPress={handleNowPress}
                style={[styles.nowButton, { backgroundColor: theme.button.secondary.background }]}
                disabled={saving}
                accessibilityLabel="Set to current time"
                accessibilityRole="button"
              >
                <Text style={[styles.nowButtonText, { color: theme.button.primary.background }]}>Now</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateTimeRow}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                  if (Platform.OS !== 'ios' && event.type === 'set') {
                    setShowWhen(false);
                  }
                }}
                accessibilityLabel="Select date"
                style={styles.datePicker}
              />
              <DateTimePicker
                value={selectedDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                accessibilityLabel="Select time"
                style={styles.timePicker}
              />
            </View>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={() => setShowWhen(false)}
                style={styles.doneButton}
                disabled={saving}
                accessibilityLabel="Done"
                accessibilityRole="button"
              >
                <Text style={[styles.doneButtonText, { color: theme.button.primary.background }]}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {showNote && (
          <View style={[styles.expandedSection, { backgroundColor: theme.background.tertiary, borderColor: theme.border.primary }]}>
            <Text style={[styles.expandedHeaderText, { color: theme.text.primary }]}>Add Note</Text>
            <TextInput
              style={[styles.noteInput, { backgroundColor: theme.input.background, borderColor: theme.input.border, color: theme.input.text }]}
              value={note}
              onChangeText={setNote}
              placeholder={isSessionBased ? `e.g., ${sessionLabel} notes` : 'Optional note'}
              placeholderTextColor={theme.input.placeholder}
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!saving}
              accessibilityLabel="Enter optional note"
            />
          </View>
        )}
      </>
    );
  };

  const handleFooterLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (Math.abs(height - footerHeight) > 1) {
      setFooterHeight(height);
    }
  };

  const renderFooter = () => {
    if (showPicker || !selectedStandard) {
      return null;
    }

    return (
      <View
        onLayout={handleFooterLayout}
        style={[
          styles.footer,
          {
            backgroundColor: theme.background.chrome,
            borderTopColor: theme.border.secondary,
            // Keep the Save button above the keyboard without shrinking the scrollable area.
            // This prevents the top content (e.g. unit label) from getting pushed off-screen
            // when the value input auto-focuses.
            bottom: effectiveKeyboardHeight,
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
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.modalBackdrop]}
        />
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.background.chrome,
              paddingTop: Math.max(insets.top, 20),
            },
          ]}
        >
            <View style={[styles.modalHeader, { backgroundColor: theme.background.chrome }]}>
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
              <View style={[styles.pickerContainer, { backgroundColor: theme.background.chrome }]}>
                {renderStandardPicker()}
              </View>
            ) : (
              <ScrollView
                style={[styles.formScroll, { backgroundColor: theme.background.chrome }]}
                contentContainerStyle={[
                  styles.form,
                  { paddingBottom: 16 + footerHeight + effectiveKeyboardHeight },
                ]}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="on-drag"
                bounces={true}
                showsVerticalScrollIndicator={true}
                scrollIndicatorInsets={{ bottom: footerHeight + effectiveKeyboardHeight }}
                contentInsetAdjustmentBehavior="always"
                scrollEventThrottle={16}
                nestedScrollEnabled={true}
              >
                {renderLoggingForm()}
              </ScrollView>
            )}

            {renderFooter()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    zIndex: 0,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 0,
    width: '100%',
    zIndex: 1,
    elevation: 1,
    position: 'relative',
  },
  pickerContainer: {
    flex: 1,
    minHeight: 300,
    // ensure picker area paints above header/footer and occupies allocated space
    alignSelf: 'stretch',
  },
  formScroll: {
    flex: 1,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  valueInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  valueInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 14,
    minHeight: 70,
  },
  valueInputWithButtons: {
    flex: 1,
  },
  quickButtonsColumn: {
    gap: 8,
    justifyContent: 'center',
    minWidth: 90,
  },
  compactQuickButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  compactQuickButtonText: {
    fontSize: 36,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputError: {},
  errorText: {
    fontSize: 14,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  compactMetaButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  compactMetaButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactMetaButtonValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  expandedSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expandedHeaderText: {
    fontSize: 15,
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  saveButton: {
    padding: 16,
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 10,
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
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  standardsList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  standardsListContent: {
    padding: 16,
    gap: 16,
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  pickerCard: {
    borderRadius: 16,
    padding: 0,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pickerCardContent: {
    gap: 0,
    padding: 16,
  },
  pickerTitleBlock: {
    flex: 1,
    gap: 4,
  },
  pickerActivityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerVolumeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickerSessionText: {
    fontSize: 13,
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
  nowButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  nowButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  doneButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePicker: {
    flex: 1,
  },
  timePicker: {
    flex: 1,
  },
});
