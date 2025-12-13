import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { StandardsLibraryScreen } from '../screens/StandardsLibraryScreen';
import { Standard } from '@minimum-standards/shared-model';

export interface StandardsLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectStandard: (standard: Standard) => void;
}

/**
 * Modal wrapper for Standards Library used in Standards Builder context.
 * Dismisses immediately after selection.
 */
export function StandardsLibraryModal({
  visible,
  onClose,
  onSelectStandard,
}: StandardsLibraryModalProps) {
  const handleSelectStandard = (standard: Standard) => {
    onSelectStandard(standard);
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
        <StandardsLibraryScreen
          onSelectStandard={handleSelectStandard}
          onBack={onClose}
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
