import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  Activity,
  CadenceUnit,
  StandardCadence,
} from '@minimum-standards/shared-model';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StandardsLibraryModal } from '../components/StandardsLibraryModal';
import { ActivityModal } from '../components/ActivityModal';
import { useStandardsBuilderStore } from '../stores/standardsBuilderStore';
import {
  CADENCE_PRESETS,
  CadencePreset,
  getCadencePreset,
  validateCadence,
} from '../utils/cadenceUtils';
import { useStandards } from '../hooks/useStandards';
import { useActivities } from '../hooks/useActivities';
import { findMatchingStandard } from '../utils/standardsFilter';
import { trackStandardEvent } from '../utils/analytics';
import { Standard } from '@minimum-standards/shared-model';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface StandardsBuilderScreenProps {
  onBack: () => void;
}

const CADENCE_UNIT_OPTIONS: CadenceUnit[] = ['day', 'week', 'month'];

export function StandardsBuilderScreen({ onBack }: StandardsBuilderScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    selectedActivity,
    setSelectedActivity,
    cadence,
    setCadence,
    minimum,
    setMinimum,
    unitOverride,
    setUnitOverride,
    getSummaryPreview,
    generatePayload,
    reset,
  } = useStandardsBuilderStore();

  const { createStandard, standards, unarchiveStandard } = useStandards();
  const { activities, createActivity } = useActivities();
  const [standardsLibraryVisible, setStandardsLibraryVisible] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [activityDropdownVisible, setActivityDropdownVisible] = useState(false);
  const [activePreset, setActivePreset] = useState<CadencePreset | null>('weekly');
  const [customIntervalInput, setCustomIntervalInput] = useState('1');
  const [customUnit, setCustomUnit] = useState<CadenceUnit>('week');
  const [cadenceError, setCadenceError] = useState<string | null>(null);
  const [minimumError, setMinimumError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dropdownButtonLayout, setDropdownButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const dropdownButtonRef = useRef<TouchableOpacity>(null);

  const summaryPreview = getSummaryPreview();

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    setActivityDropdownVisible(false);
  };

  const handleActivityCreate = (activity: Activity) => {
    setSelectedActivity(activity);
    setActivityModalVisible(false);
  };

  const handleActivitySave = async (
    activityData: Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>
  ): Promise<Activity> => {
    return await createActivity(activityData);
  };

  const handleStandardSelect = (standard: Standard) => {
    // Find the activity by activityId
    const activity = activities.find((a) => a.id === standard.activityId);
    if (activity) {
      setSelectedActivity(activity);
    }
    setCadence(standard.cadence);
    setMinimum(standard.minimum);
    setUnitOverride(standard.unit);
    setStandardsLibraryVisible(false);
  };

  const handlePresetPress = useCallback(
    (preset: CadencePreset) => {
      const presetCadence = getCadencePreset(preset);
      setActivePreset(preset);
      setCadence(presetCadence);
      setCadenceError(null);
      setCustomIntervalInput(String(presetCadence.interval));
      setCustomUnit(presetCadence.unit);
    },
    [setActivePreset, setCadence, setCadenceError, setCustomIntervalInput, setCustomUnit]
  );

  const handleCustomIntervalChange = (value: string) => {
    setCustomIntervalInput(value);
    setActivePreset(null);

    const numeric = Number(value);
    if (!value) {
      setCadenceError('Interval required for custom cadence');
      setCadence(null);
      return;
    }

    const validation = validateCadence(
      Number.isNaN(numeric) ? null : numeric,
      customUnit
    );

    if (!validation.isValid) {
      setCadenceError(validation.error ?? 'Invalid cadence');
      setCadence(null);
      return;
    }

    setCadenceError(null);
    setCadence({ interval: numeric as number, unit: customUnit } as StandardCadence);
  };

  const handleCustomUnitChange = (unit: CadenceUnit) => {
    setCustomUnit(unit);
    setActivePreset(null);
    handleCustomIntervalChange(customIntervalInput);
  };

  const handleMinimumChange = (text: string) => {
    if (!text) {
      setMinimum(null);
      setMinimumError('Minimum is required');
      return;
    }

    const numeric = Number(text);
    if (Number.isNaN(numeric) || numeric <= 0) {
      setMinimumError('Enter a positive number');
      setMinimum(null);
      return;
    }

    setMinimumError(null);
    setMinimum(numeric);
  };

  const handleUnitOverrideChange = (text: string) => {
    setUnitOverride(text.trim() ? text.trim() : null);
  };

  const resetForm = () => {
    reset();
    setActivePreset('weekly');
    setCustomIntervalInput('1');
    setCustomUnit('week');
    setCadenceError(null);
    setMinimumError(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveError(null);
    if (!selectedActivity) {
      setSaveError('Select an activity first');
      return;
    }
    if (!minimum || minimum <= 0) {
      setMinimumError('Minimum is required');
      return;
    }
    if (!cadence) {
      setCadenceError('Pick a cadence');
      return;
    }

    const payload = generatePayload();
    if (!payload) {
      setSaveError('Complete cadence + minimum to continue');
      return;
    }

    // Check for duplicate Standard
    const matchingStandard = findMatchingStandard(
      standards,
      payload.activityId,
      payload.cadence,
      payload.minimum,
      payload.unit
    );

    setSaving(true);
    try {
      if (matchingStandard) {
        // If duplicate found and archived: unarchive it
        if (
          matchingStandard.state === 'archived' ||
          matchingStandard.archivedAtMs !== null
        ) {
          await unarchiveStandard(matchingStandard.id);
          Alert.alert(
            'Standard activated',
            'An existing archived Standard has been activated.'
          );
        } else {
          // If duplicate found and active: show error
          setSaveError('A Standard with these values already exists');
          setSaving(false);
          return;
        }
      } else {
        // No duplicate found: create new Standard
        await createStandard(payload);
        trackStandardEvent('standard_create', {
          activityId: payload.activityId,
          archived: false,
          cadence: payload.cadence,
        });
        Alert.alert('Standard saved', 'Your Standard has been saved successfully.');
      }
      resetForm();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save Standard'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCustomPress = useCallback(() => {
    setActivePreset(null);
    setCadenceError(null);
  }, []);

  const cadencePresetButtons = useMemo(
    () => {
      const presetButtons = (Object.keys(CADENCE_PRESETS) as CadencePreset[]).map((preset) => {
        const isActive = activePreset === preset;
        return (
          <TouchableOpacity
            key={preset}
            style={[
              styles.pillButton,
              {
                backgroundColor: isActive ? theme.button.primary.background : theme.button.secondary.background,
              },
            ]}
            onPress={() => handlePresetPress(preset)}
          >
            <Text
              style={[
                styles.pillButtonText,
                {
                  fontSize: typography.button.pill.fontSize,
                  fontWeight: typography.button.pill.fontWeight,
                  color: isActive ? theme.button.primary.text : theme.text.secondary,
                },
              ]}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      });

      const isCustomActive = activePreset === null;
      const customButton = (
        <TouchableOpacity
          key="custom"
          style={[
            styles.pillButton,
            {
              backgroundColor: isCustomActive ? theme.button.primary.background : theme.button.secondary.background,
            },
          ]}
          onPress={handleCustomPress}
        >
          <Text
            style={[
              styles.pillButtonText,
              {
                fontSize: typography.button.pill.fontSize,
                fontWeight: typography.button.pill.fontWeight,
                color: isCustomActive ? theme.button.primary.text : theme.text.secondary,
              },
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      );

      return [...presetButtons, customButton];
    },
    [activePreset, handlePresetPress, handleCustomPress, theme]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.fullScreen, { backgroundColor: theme.background.primary }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border.primary, backgroundColor: theme.background.secondary, paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.backButton, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.link }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Create Standard</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <ScrollView style={styles.form} contentContainerStyle={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}>
          <View style={styles.stepHeader}>
            <Text style={[styles.sectionLabel, { color: theme.text.tertiary }]}>Step 1</Text>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Select or create an activity</Text>
          </View>
          
          <View style={styles.activitySelectorRow}>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                ref={dropdownButtonRef}
                style={[
                  styles.activityDropdown,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: theme.input.border,
                  },
                ]}
                onLayout={() => {
                  // Measure button position relative to window
                  dropdownButtonRef.current?.measureInWindow((x, y, width, height) => {
                    setDropdownButtonLayout({ x, y, width, height });
                  });
                }}
                onPress={() => {
                  // Measure position when opening dropdown
                  dropdownButtonRef.current?.measureInWindow((x, y, width, height) => {
                    setDropdownButtonLayout({ x, y, width, height });
                  });
                  setActivityDropdownVisible(!activityDropdownVisible);
                }}
              >
                <View style={styles.activityDropdownContent}>
                  {selectedActivity ? (
                    <View style={styles.selectedActivityContent}>
                      <Text style={[styles.selectedActivityName, { color: theme.text.primary }]}>
                        {selectedActivity.name}
                      </Text>
                      <Text style={[styles.selectedActivityUnit, { color: theme.text.secondary }]}>
                        {selectedActivity.unit}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.dropdownPlaceholder, { color: theme.input.placeholder }]}>
                      Select an activity...
                    </Text>
                  )}
                </View>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={theme.text.secondary}
                  style={[
                    styles.dropdownChevron,
                    activityDropdownVisible && styles.dropdownChevronOpen,
                  ]}
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.createActivityButton, { backgroundColor: theme.button.primary.background }]}
              onPress={() => setActivityModalVisible(true)}
            >
              <Text style={[styles.createActivityButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}>
          <View style={styles.stepHeader}>
            <Text style={[styles.sectionLabel, { color: theme.text.tertiary }]}>Step 2</Text>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Minimum + unit</Text>
          </View>
          <View style={styles.minimumUnitRow}>
            <View style={styles.minimumUnitField}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: theme.input.border,
                    color: theme.input.text,
                  },
                ]}
                placeholderTextColor={theme.input.placeholder}
                keyboardType="number-pad"
                placeholder="Minimum Qty"
                value={minimum ? String(minimum) : ''}
                onChangeText={handleMinimumChange}
              />
              {minimumError && <Text style={[styles.errorText, { color: theme.input.borderError }]}>{minimumError}</Text>}
            </View>
            <View style={styles.minimumUnitField}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: theme.input.border,
                    color: theme.input.text,
                  },
                ]}
                placeholderTextColor={theme.input.placeholder}
                placeholder={
                  selectedActivity
                    ? `Unit (default ${selectedActivity.unit})`
                    : 'Unit'
                }
                value={unitOverride ?? ''}
                onChangeText={handleUnitOverrideChange}
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}>
          <View style={styles.stepHeader}>
            <Text style={[styles.sectionLabel, { color: theme.text.tertiary }]}>Step 3</Text>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Cadence</Text>
          </View>
          <View style={styles.pillRow}>{cadencePresetButtons}</View>

          {activePreset === null && (
            <View style={styles.customCadenceRow}>
              <View style={styles.customField}>
                <Text style={[styles.inputLabel, { color: theme.text.secondary }]}>Custom interval</Text>
                <TextInput
                  value={customIntervalInput}
                  onChangeText={handleCustomIntervalChange}
                  keyboardType="number-pad"
                  placeholder="e.g. 2"
                  placeholderTextColor={theme.input.placeholder}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.input.background,
                      borderColor: theme.input.border,
                      color: theme.input.text,
                    },
                  ]}
                />
              </View>
              <View style={styles.customField}>
                <Text style={[styles.inputLabel, { color: theme.text.secondary }]}>Unit</Text>
                <View style={styles.unitRow}>
                  {CADENCE_UNIT_OPTIONS.map((unit) => {
                    const isActive = customUnit === unit;
                    return (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.unitButton,
                          {
                            borderColor: theme.border.primary,
                            backgroundColor: isActive ? theme.background.tertiary : 'transparent',
                          },
                        isActive && { borderColor: theme.link },
                        ]}
                        onPress={() => handleCustomUnitChange(unit)}
                      >
                        <Text
                          style={[
                            styles.unitButtonText,
                            {
                              fontSize: typography.button.secondary.fontSize,
                              fontWeight: typography.button.secondary.fontWeight,
                              color: isActive ? theme.link : theme.text.secondary,
                            },
                          ]}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
          {cadenceError && <Text style={[styles.errorText, { color: theme.input.borderError }]}>{cadenceError}</Text>}
        </View>
        </ScrollView>

        <View style={[styles.stickyFooter, { backgroundColor: theme.background.secondary, borderTopColor: theme.border.secondary, paddingBottom: Math.max(insets.bottom, 16) }]}>
          {summaryPreview && (
            <Text style={[styles.stickySummary, { color: theme.text.primary }]}>
              {summaryPreview}
            </Text>
          )}
          {saveError && <Text style={[styles.errorText, { color: theme.input.borderError }]}>{saveError}</Text>}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border.primary }]} onPress={resetForm}>
              <Text style={[styles.secondaryButtonText, { fontSize: typography.button.secondary.fontSize, fontWeight: typography.button.secondary.fontWeight, color: theme.text.primary }]}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.button.primary.background },
                saving && styles.primaryButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={[styles.primaryButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {activityDropdownVisible && (
        <>
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            activeOpacity={1}
            onPress={() => setActivityDropdownVisible(false)}
          />
          {dropdownButtonLayout && (
            <View
              style={[
                styles.dropdownContent,
                {
                  backgroundColor: theme.background.modal,
                  borderColor: theme.border.primary,
                  shadowColor: theme.shadow,
                  top: dropdownButtonLayout.y + dropdownButtonLayout.height + 4,
                  left: dropdownButtonLayout.x,
                  width: dropdownButtonLayout.width,
                },
              ]}
            >
              {activities.length === 0 ? (
                <View style={styles.dropdownEmpty}>
                  <Text style={[styles.dropdownEmptyText, { color: theme.text.secondary }]}>
                    No activities
                  </Text>
                </View>
              ) : (
                <View style={styles.dropdownListContent}>
                  {activities.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.activityDropdownItem,
                        {
                          backgroundColor: selectedActivity?.id === item.id ? theme.background.tertiary : 'transparent',
                          borderBottomColor: theme.border.secondary,
                        },
                      ]}
                      onPress={() => handleActivitySelect(item)}
                    >
                      <View style={styles.activityDropdownItemContent}>
                        <Text style={[styles.activityDropdownItemName, { color: theme.text.primary }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.activityDropdownItemUnit, { color: theme.text.secondary }]}>
                          {item.unit}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </>
      )}

      <StandardsLibraryModal
        visible={standardsLibraryVisible}
        onClose={() => setStandardsLibraryVisible(false)}
        onSelectStandard={handleStandardSelect}
      />
      <ActivityModal
        visible={activityModalVisible}
        onClose={() => setActivityModalVisible(false)}
        onSave={handleActivitySave}
        onSelect={handleActivityCreate}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    // fontSize and fontWeight come from typography.button.primary
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 64,
  },
  body: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  stickyFooter: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  stickySummary: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
  },
  selectionCard: {
    padding: 16,
    borderRadius: 10,
    gap: 6,
  },
  selectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  selectionName: {
    fontSize: 20,
    fontWeight: '700',
  },
  selectionMeta: {
    fontSize: 14,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillButtonText: {
    // fontSize and fontWeight come from typography.button.pill
    textTransform: 'capitalize',
  },
  customCadenceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  customField: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  unitButtonText: {
    // fontSize and fontWeight come from typography.button.secondary
    textTransform: 'capitalize',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    // fontSize and fontWeight come from typography.button.secondary
  },
  errorText: {
    fontSize: 14,
  },
  minimumUnitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  minimumUnitField: {
    flex: 1,
    gap: 6,
  },
  activitySelectorRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
  },
  activityDropdown: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityDropdownContent: {
    flex: 1,
  },
  selectedActivityContent: {
    gap: 4,
  },
  dropdownChevron: {
    marginLeft: 8,
    transform: [{ rotate: '0deg' }],
  },
  dropdownChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  selectedActivityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedActivityUnit: {
    fontSize: 14,
  },
  dropdownPlaceholder: {
    fontSize: 16,
  },
  createActivityButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createActivityButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownContent: {
    position: 'absolute',
    maxHeight: 300,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownListContent: {
    paddingVertical: 8,
  },
  activityDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityDropdownItemContent: {
    gap: 4,
  },
  activityDropdownItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityDropdownItemUnit: {
    fontSize: 14,
  },
  dropdownEmpty: {
    padding: 32,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 16,
  },
});