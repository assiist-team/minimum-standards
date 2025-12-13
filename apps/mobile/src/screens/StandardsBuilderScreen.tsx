import React, { useCallback, useMemo, useState } from 'react';
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
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ActivityLibraryModal } from '../components/ActivityLibraryModal';
import { StandardsLibraryModal } from '../components/StandardsLibraryModal';
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

export interface StandardsBuilderScreenProps {
  onBack: () => void;
}

const CADENCE_UNIT_OPTIONS: CadenceUnit[] = ['day', 'week', 'month'];

export function StandardsBuilderScreen({ onBack }: StandardsBuilderScreenProps) {
  const {
    selectedActivity,
    setSelectedActivity,
    cadence,
    setCadence,
    minimum,
    setMinimum,
    unitOverride,
    setUnitOverride,
    isArchived,
    setIsArchived,
    getSummaryPreview,
    generatePayload,
    reset,
  } = useStandardsBuilderStore();

  const { createStandard, standards, unarchiveStandard } = useStandards();
  const { activities } = useActivities();
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [standardsLibraryVisible, setStandardsLibraryVisible] = useState(false);
  const [activePreset, setActivePreset] = useState<CadencePreset | null>('weekly');
  const [customIntervalInput, setCustomIntervalInput] = useState('1');
  const [customUnit, setCustomUnit] = useState<CadenceUnit>('week');
  const [cadenceError, setCadenceError] = useState<string | null>(null);
  const [minimumError, setMinimumError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const summaryPreview = getSummaryPreview();

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    setLibraryVisible(false);
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
        await createStandard({
          ...payload,
          isArchived,
        });
        trackStandardEvent('standard_create', {
          activityId: payload.activityId,
          archived: isArchived,
          cadence: payload.cadence,
        });
        if (isArchived) {
          trackStandardEvent('standard_archive', {
            activityId: payload.activityId,
          });
        }
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

  const cadencePresetButtons = useMemo(
    () =>
      (Object.keys(CADENCE_PRESETS) as CadencePreset[]).map((preset) => {
        const isActive = activePreset === preset;
        return (
          <TouchableOpacity
            key={preset}
            style={[
              styles.pillButton,
              isActive && styles.pillButtonActive,
            ]}
            onPress={() => handlePresetPress(preset)}
          >
            <Text
              style={[
                styles.pillButtonText,
                isActive && styles.pillButtonTextActive,
              ]}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      }),
    [activePreset, handlePresetPress]
  );

  const archiveMessage = isArchived
    ? 'Archived Standards cannot accept new log entries.'
    : 'When active, Standards can be logged from the dashboard.';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.fullScreen}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Standards Builder</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Step 1</Text>
          <Text style={styles.sectionTitle}>Select or create an activity</Text>
          {selectedActivity ? (
            <View style={styles.selectionCard}>
              <Text style={styles.selectionLabel}>Selected Activity</Text>
              <Text style={styles.selectionName}>{selectedActivity.name}</Text>
              <Text style={styles.selectionMeta}>{selectedActivity.unit}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>
              Choose an activity to link to this Standard.
            </Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setLibraryVisible(true)}
            >
              <Text style={styles.primaryButtonText}>
                {selectedActivity ? 'Change Activity' : 'Open Activity Library'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStandardsLibraryVisible(true)}
            >
              <Text style={styles.secondaryButtonText}>
                Select from Existing Standard
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Step 2</Text>
          <Text style={styles.sectionTitle}>Cadence</Text>
          <View style={styles.pillRow}>{cadencePresetButtons}</View>

          <View style={styles.customCadenceRow}>
            <View style={styles.customField}>
              <Text style={styles.inputLabel}>Custom interval</Text>
              <TextInput
                value={customIntervalInput}
                onChangeText={handleCustomIntervalChange}
                keyboardType="number-pad"
                placeholder="e.g. 2"
                style={styles.input}
              />
            </View>
            <View style={styles.customField}>
              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.unitRow}>
                {CADENCE_UNIT_OPTIONS.map((unit) => {
                  const isActive = customUnit === unit && !activePreset;
                  return (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitButton,
                        isActive && styles.unitButtonActive,
                      ]}
                      onPress={() => handleCustomUnitChange(unit)}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          isActive && styles.unitButtonTextActive,
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
          {cadenceError && <Text style={styles.errorText}>{cadenceError}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Step 3</Text>
          <Text style={styles.sectionTitle}>Minimum + unit</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Minimum value"
            value={minimum ? String(minimum) : ''}
            onChangeText={handleMinimumChange}
          />
          {minimumError && <Text style={styles.errorText}>{minimumError}</Text>}

          <TextInput
            style={styles.input}
            placeholder={
              selectedActivity
                ? `Unit (default ${selectedActivity.unit})`
                : 'Unit override'
            }
            value={unitOverride ?? ''}
            onChangeText={handleUnitOverrideChange}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Live preview</Text>
            <Text style={styles.summaryValue}>
              {summaryPreview || 'Complete the steps to see summary'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.archiveRow}>
            <View style={styles.archiveCopyColumn}>
              <Text style={styles.sectionTitle}>Archive immediately</Text>
              <Text style={styles.archiveCopy}>{archiveMessage}</Text>
            </View>
            <Switch
              value={isArchived}
              onValueChange={(value) => {
                setIsArchived(value);
                trackStandardEvent('standard_archive_toggle', {
                  archived: value,
                  activityId: selectedActivity?.id,
                });
              }}
            />
          </View>
        </View>

        {saveError && <Text style={styles.errorText}>{saveError}</Text>}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              saving && styles.primaryButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? 'Saving…' : 'Save Standard'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ActivityLibraryModal
        visible={libraryVisible}
        onClose={() => setLibraryVisible(false)}
        onSelectActivity={handleActivitySelect}
      />
      <StandardsLibraryModal
        visible={standardsLibraryVisible}
        onClose={() => setStandardsLibraryVisible(false)}
        onSelectStandard={handleStandardSelect}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    color: '#0F62FE',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  headerSpacer: {
    width: 64,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
  },
  selectionCard: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f4f6fb',
    gap: 6,
  },
  selectionLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  selectionName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  selectionMeta: {
    fontSize: 14,
    color: '#6b7280',
  },
  primaryButton: {
    backgroundColor: '#0F62FE',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f3f5',
  },
  pillButtonActive: {
    backgroundColor: '#0F62FE',
  },
  pillButtonText: {
    color: '#5f6368',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  pillButtonTextActive: {
    color: '#fff',
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
    color: '#5f6368',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dfe3e8',
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
    borderColor: '#dfe3e8',
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#E6F0FF',
    borderColor: '#0F62FE',
  },
  unitButtonText: {
    color: '#5f6368',
    textTransform: 'capitalize',
  },
  unitButtonTextActive: {
    color: '#0F62FE',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  summaryLabel: {
    color: '#F1F5F9',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  archiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  archiveCopyColumn: {
    flex: 1,
  },
  archiveCopy: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'column',
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
    borderColor: '#dfe3e8',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111',
    fontWeight: '600',
  },
  errorText: {
    color: '#d93025',
    fontSize: 14,
  },
});