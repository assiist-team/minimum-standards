import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Standard } from '@minimum-standards/shared-model';
import { LogEntryModal } from './LogEntryModal';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { BUTTON_BORDER_RADIUS } from '../theme/radius';
import { trackStandardEvent } from '../utils/analytics';

const CARD_SPACING = 16;

export interface StickyLogButtonProps {
  onCreateLogEntry: (params: {
    standardId: string;
    value: number;
    occurredAtMs: number;
    note?: string | null;
  }) => Promise<void>;
  onUpdateLogEntry?: (params: {
    logEntryId: string;
    standardId: string;
    value: number;
    occurredAtMs: number;
    note?: string | null;
  }) => Promise<void>;
  resolveActivityName?: (activityId: string) => string | undefined;
}

export function StickyLogButton({
  onCreateLogEntry,
  onUpdateLogEntry,
  resolveActivityName,
}: StickyLogButtonProps) {
  const theme = useTheme();
  const [modalState, setModalState] = useState<{
    visible: boolean;
    standard: Standard | null;
  }>({
    visible: false,
    standard: null,
  });

  const handleLogPress = useCallback(() => {
    trackStandardEvent('sticky_log_button_tap', {});
    const next = { visible: true, standard: null as Standard | null };
    console.log('[StickyLogButton] handleLogPress -> opening modal with', next);
    setModalState(next);
  }, []);

  const handleLogSave = useCallback(
    async (
      standardId: string,
      value: number,
      occurredAtMs: number,
      note?: string | null,
      logEntryId?: string
    ) => {
      if (logEntryId && onUpdateLogEntry) {
        // Edit mode: use updateLogEntry
        await onUpdateLogEntry({ logEntryId, standardId, value, occurredAtMs, note });
      } else {
        // Create mode: use createLogEntry
        await onCreateLogEntry({ standardId, value, occurredAtMs, note });
      }
      // Firestore listener will automatically update the UI
    },
    [onCreateLogEntry, onUpdateLogEntry]
  );

  const handleLogModalClose = useCallback(() => {
    console.log('[StickyLogButton] handleLogModalClose -> closing modal');
    setModalState({
      visible: false,
      standard: null,
    });
  }, []);

  console.log('[StickyLogButton] render modalState=', modalState);
  return (
    <>
      {/* Sticky Log button positioned above tab bar divider - appears as part of tab bar container */}
      <View
        style={[
          styles.stickyLogButtonContainer,
          {
            backgroundColor: theme.tabBar.background,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleLogPress}
          style={[styles.stickyLogButton, { backgroundColor: theme.button.primary.background }]}
          accessibilityRole="button"
          accessibilityLabel="Log activity"
        >
          <Text
            style={[
              styles.stickyLogButtonText,
              {
                fontSize: typography.button.primary.fontSize,
                fontWeight: typography.button.primary.fontWeight,
                color: theme.button.primary.text,
              },
            ]}
          >
            Log
          </Text>
        </TouchableOpacity>
      </View>

      <LogEntryModal
        visible={modalState.visible}
        standard={modalState.standard}
        onClose={handleLogModalClose}
        onSave={handleLogSave}
        resolveActivityName={resolveActivityName}
      />
    </>
  );
}

const styles = StyleSheet.create({
  stickyLogButtonContainer: {
    paddingHorizontal: CARD_SPACING,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  stickyLogButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  stickyLogButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
});
