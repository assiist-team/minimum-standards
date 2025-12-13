import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Activity, activitySchema } from '@minimum-standards/shared-model';

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
}

export function ActivityModal({
  visible,
  activity,
  onClose,
  onSave,
  onSelect,
}: ActivityModalProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEditMode = !!activity;

  // Initialize form when activity changes
  useEffect(() => {
    if (activity) {
      setName(activity.name);
      setUnit(activity.unit);
    } else {
      // Reset form for create mode
      setName('');
      setUnit('');
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
        createdAtMs: activity?.createdAtMs || Date.now(),
        updatedAtMs: Date.now(),
        deletedAtMs: activity?.deletedAtMs || null,
      });

      const savePayload: Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'> = {
        name: activityData.name,
        unit: activityData.unit, // Already normalized by schema
      };

      const createdActivity = await onSave(savePayload);

      // If this is create mode and onSelect is provided (builder context), select the new activity
      if (!isEditMode && onSelect) {
        onSelect(createdActivity);
      }

      // Reset form and close
      setName('');
      setUnit('');
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Edit Activity' : 'Add Activity'}
            </Text>
            <TouchableOpacity onPress={handleClose} disabled={saving}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* Name field */}
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors({ ...errors, name: undefined });
                  }
                }}
                placeholder="e.g., Sales Calls"
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
                style={[styles.input, errors.unit && styles.inputError]}
                value={unit}
                onChangeText={(text) => {
                  setUnit(text);
                  if (errors.unit) {
                    setErrors({ ...errors, unit: undefined });
                  }
                }}
                placeholder="e.g., calls (will be pluralized)"
                maxLength={40}
                editable={!saving}
              />
              {errors.unit && <Text style={styles.errorText}>{errors.unit}</Text>}
            </View>

            {/* Save error */}
            {saveError && <Text style={styles.errorText}>{saveError}</Text>}

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
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
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
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
});
