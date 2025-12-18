import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Activity, activitySchema } from '@minimum-standards/shared-model';
import { useTheme } from '../theme/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ActivityModalProps {
  visible: boolean;
  activity?: Activity | null;
  onClose: () => void;
  onSave: (activity: Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>) => Promise<Activity>;
  onSelect?: (activity: Activity) => void; // For builder context - auto-select after create
}

interface FormErrors {
  name?: string;
  unit?: string;
  notes?: string;
}

export function ActivityModal({
  visible,
  activity,
  onClose,
  onSave,
  onSelect,
}: ActivityModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEditMode = !!activity;

  // Initialize form when activity changes
  useEffect(() => {
    if (activity) {
      setName(activity.name);
      setUnit(activity.unit);
      setNotes(activity.notes ?? '');
    } else {
      // Reset form for create mode
      setName('');
      setUnit('');
      setNotes('');
    }
    setErrors({});
    setSaveError(null);
  }, [activity, visible]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.length > 120) {
      newErrors.name = 'Name cannot exceed 120 characters';
    }

    // Validate unit
    if (!unit.trim()) {
      newErrors.unit = 'Unit is required';
    } else if (unit.length > 40) {
      newErrors.unit = 'Unit cannot exceed 40 characters';
    }

    // Validate notes
    if (notes.length > 1000) {
      newErrors.notes = 'Notes cannot exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      // Parse through schema to normalize unit
      const activityData = activitySchema.parse({
        id: activity?.id || 'temp',
        name: name.trim(),
        unit: unit.trim(),
        notes: notes.trim() || null,
        createdAtMs: activity?.createdAtMs || Date.now(),
        updatedAtMs: Date.now(),
        deletedAtMs: activity?.deletedAtMs || null,
      });

      const savePayload: Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'> = {
        name: activityData.name,
        unit: activityData.unit, // Already normalized by schema
        notes: activityData.notes,
      };

      const createdActivity = await onSave(savePayload);

      // If this is create mode and onSelect is provided (builder context), select the new activity
      if (!isEditMode && onSelect) {
        onSelect(createdActivity);
      }

      // Reset form and close
      setName('');
      setUnit('');
      setNotes('');
      setErrors({});
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError('Failed to save activity');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) {
      return; // Prevent closing while saving
    }
    setName('');
    setUnit('');
    setNotes('');
    setErrors({});
    setSaveError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.background.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.bottom + 16}
          style={styles.keyboardAvoider}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.background.modal, paddingBottom: 20 + insets.bottom },
            ]}
          >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Edit Activity' : 'Add Activity'}
            </Text>
            <TouchableOpacity onPress={handleClose} disabled={saving}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Name field */}
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: errors.name ? theme.input.borderError : theme.input.border,
                    color: theme.input.text,
                  },
                ]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors({ ...errors, name: undefined });
                  }
                }}
                placeholder="e.g., Sales Calls"
                placeholderTextColor={theme.input.placeholder}
                maxLength={120}
                editable={!saving}
                autoFocus={!isEditMode}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Unit field */}
            <View style={styles.field}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: errors.unit ? theme.input.borderError : theme.input.border,
                    color: theme.input.text,
                  },
                ]}
                value={unit}
                onChangeText={(text) => {
                  setUnit(text);
                  if (errors.unit) {
                    setErrors({ ...errors, unit: undefined });
                  }
                }}
                placeholder="e.g., calls (will be pluralized)"
                placeholderTextColor={theme.input.placeholder}
                maxLength={40}
                editable={!saving}
              />
              {errors.unit && <Text style={styles.errorText}>{errors.unit}</Text>}
            </View>

            {/* Notes field */}
            <View style={styles.field}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: errors.notes ? theme.input.borderError : theme.input.border,
                    color: theme.input.text,
                  },
                ]}
                value={notes}
                onChangeText={(text) => {
                  setNotes(text);
                  if (errors.notes) {
                    setErrors({ ...errors, notes: undefined });
                  }
                }}
                placeholder="Add any additional notes about this activity..."
                placeholderTextColor={theme.input.placeholder}
                maxLength={1000}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!saving}
              />
              {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
            </View>

            {/* Save error */}
            {saveError && <Text style={styles.errorText}>{saveError}</Text>}

            {/* Save button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: saving ? theme.button.disabled.background : theme.button.primary.background,
                },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={theme.button.primary.text} />
              ) : (
                <Text style={[styles.saveButtonText, { color: theme.button.primary.text }]}>Save</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    padding: 20,
    maxHeight: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  formScroll: {
    flexGrow: 1,
  },
  form: {
    gap: 16,
    paddingBottom: 8,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
