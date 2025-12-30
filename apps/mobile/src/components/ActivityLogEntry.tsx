import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { formatUnitWithCount } from '@minimum-standards/shared-model';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/useTheme';

export interface ActivityLogEntryProps {
  value: number;
  unit: string;
  occurredAtMs: number;
  note: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ActivityLogEntry({
  value,
  unit,
  occurredAtMs,
  note,
  onEdit,
  onDelete,
}: ActivityLogEntryProps) {
  const theme = useTheme();

  const formatTimestamp = (timestampMs: number): string => {
    const date = new Date(timestampMs);
    const now = new Date();
    const diffMs = now.getTime() - timestampMs;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today - show time only
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      // Yesterday
      return `Yesterday ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`;
    } else if (diffDays < 7) {
      // This week - show day and time
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      // Older - show date and time
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  const formattedValue = `${value} ${formatUnitWithCount(unit, value)}`;
  const formattedTimestamp = formatTimestamp(occurredAtMs);

  const showActions = onEdit || onDelete;

  return (
    <View style={[styles.container, { backgroundColor: theme.background.card, borderColor: theme.border.secondary }]}>
      <View style={styles.content}>
        <View style={styles.valueSection}>
          <Text style={[styles.value, { color: theme.text.primary }]}>
            {formattedValue}
          </Text>
          <Text style={[styles.timestamp, { color: theme.text.secondary }]}>
            {formattedTimestamp}
          </Text>
        </View>

        {note && (
          <View style={styles.noteSection}>
            <Text style={[styles.note, { color: theme.text.primary }]} numberOfLines={2}>
              {note}
            </Text>
          </View>
        )}

        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel="Edit log entry"
              >
                <MaterialIcons name="edit" size={20} color={theme.button.icon.icon} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={onDelete}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel="Delete log entry"
              >
                <MaterialIcons name="delete" size={20} color={theme.button.icon.icon} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  content: {
    padding: 16,
  },
  valueSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 14,
  },
  noteSection: {
    marginTop: 8,
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
});