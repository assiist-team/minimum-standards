import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography, BUTTON_BORDER_RADIUS, SCREEN_PADDING } from '@nine4/ui-kit';
import { BottomSheet } from './BottomSheet';

export interface BottomSheetConfirmationProps {
  visible: boolean;
  onRequestClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function BottomSheetConfirmation({
  visible,
  onRequestClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: BottomSheetConfirmationProps) {
  const theme = useTheme();
  const pendingAction = useRef<'confirm' | null>(null);

  const handleConfirm = useCallback(() => {
    pendingAction.current = 'confirm';
    onRequestClose();
  }, [onRequestClose]);

  const handleCancel = useCallback(() => {
    pendingAction.current = null;
    if (onCancel) {
      onCancel();
    } else {
      onRequestClose();
    }
  }, [onCancel, onRequestClose]);

  const handleDismiss = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    if (action === 'confirm') {
      requestAnimationFrame(onConfirm);
    }
  }, [onConfirm]);

  const confirmBg = destructive
    ? theme.button.destructive.background
    : theme.button.primary.background;
  const confirmText = destructive
    ? theme.button.destructive.text
    : theme.button.primary.text;

  return (
    <BottomSheet visible={visible} onRequestClose={onRequestClose} onDismiss={handleDismiss}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text.primary }]}>{title}</Text>
        <Text style={[styles.message, { color: theme.text.secondary }]}>{message}</Text>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [
              styles.button,
              styles.cancelButton,
              { borderColor: theme.border.primary },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <Text style={[styles.buttonText, { color: theme.text.primary }]}>{cancelLabel}</Text>
          </Pressable>

          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: confirmBg },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
          >
            <Text style={[styles.buttonText, { color: confirmText }]}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: typography.header.small.fontSize,
    fontWeight: typography.header.small.fontWeight,
  },
  message: {
    fontSize: typography.text.small.fontSize,
    fontWeight: typography.text.small.fontWeight,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: typography.button.primary.fontSize,
    fontWeight: typography.button.primary.fontWeight,
  },
  pressed: {
    opacity: 0.8,
  },
});
