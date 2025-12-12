import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { ActivityLibraryScreen } from '../screens/ActivityLibraryScreen';
import { Activity } from '@minimum-standards/shared-model';

export interface ActivityLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
}

/**
 * Modal wrapper for Activity Library used in Standards Builder context.
 * Dismisses immediately after selection or creation.
 */
export function ActivityLibraryModal({
  visible,
  onClose,
  onSelectActivity,
}: ActivityLibraryModalProps) {
  const handleSelectActivity = (activity: Activity) => {
    onSelectActivity(activity);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ActivityLibraryScreen
          onSelectActivity={handleSelectActivity}
          hideDestructiveControls={true}
          onClose={onClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
