import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Standard } from '@minimum-standards/shared-model';
import { useStandards } from '../hooks/useStandards';
import { trackStandardEvent } from '../utils/analytics';
import { ErrorBanner } from '../components/ErrorBanner';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface ArchivedStandardsScreenProps {
  onBack: () => void;
}

function formatDate(timestampMs: number | null): string {
  if (!timestampMs) {
    return 'Unknown date';
  }
  const date = new Date(timestampMs);
  return date.toLocaleDateString();
}

function CadenceLine({ standard, theme }: { standard: Standard; theme: ReturnType<typeof useTheme> }) {
  const { interval, unit } = standard.cadence;
  const cadenceLabel =
    interval === 1 ? unit : `${interval} ${unit}${interval > 1 ? 's' : ''}`;
  return (
    <Text style={[styles.historyValue, { color: theme.text.secondary }]}>
      Cadence: every {cadenceLabel}
    </Text>
  );
}

export function ArchivedStandardsScreen({
  onBack,
}: ArchivedStandardsScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { archivedStandards, unarchiveStandard, error } = useStandards();

  const handleUnarchive = async (standard: Standard) => {
    await unarchiveStandard(standard.id);
    trackStandardEvent('standard_unarchive', {
      standardId: standard.id,
      activityId: standard.activityId,
    });
  };

  const renderStandard = ({ item }: { item: Standard }) => (
    <View style={[styles.card, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.activityLabel, { color: theme.text.secondary }]}>Activity ID {item.activityId}</Text>
        <View style={[styles.badge, { backgroundColor: theme.archive.badgeBackground }]}>
          <Text style={[styles.badgeText, { color: theme.archive.badgeText }]}>Inactive</Text>
        </View>
      </View>
      <Text style={[styles.summary, { color: theme.text.primary }]}>{item.summary}</Text>

      <View style={[styles.historyBlock, { backgroundColor: theme.background.tertiary }]}>
        <Text style={[styles.historyLabel, { color: theme.text.primary }]}>Read-only details</Text>
        <Text style={[styles.historyValue, { color: theme.text.secondary }]}>
          Minimum: {item.minimum} {item.unit}
        </Text>
        <CadenceLine standard={item} theme={theme} />
        <Text style={[styles.historyValue, { color: theme.text.secondary }]}>
          Deactivated on {formatDate(item.archivedAtMs)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.logButton, { backgroundColor: theme.button.disabled.background }]}
        disabled={true}
        accessibilityRole="button"
        accessibilityLabel="Logging disabled for inactive standards"
        accessibilityState={{ disabled: true }}
      >
        <Text style={[styles.logButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.text.disabled }]}>Logging disabled for inactive standards</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: theme.link }]}
        onPress={() => handleUnarchive(item)}
        accessibilityRole="button"
        accessibilityLabel="Activate standard"
      >
        <MaterialIcons name="toggle-on" size={24} color={theme.button.icon.icon} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: theme.border.secondary, backgroundColor: theme.background.secondary, paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.backButton, { color: theme.link }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Inactive Standards</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ErrorBanner error={error} />

      {archivedStandards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No inactive Standards</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
            Active Standards will appear here when you deactivate them.
          </Text>
        </View>
      ) : (
        <FlatList
          data={archivedStandards}
          keyExtractor={(item) => item.id}
          renderItem={renderStandard}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
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
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 64,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityLabel: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summary: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyBlock: {
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyValue: {
    fontSize: 14,
  },
  logButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
