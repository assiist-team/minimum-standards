import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Standard } from '@minimum-standards/shared-model';
import { useStandards } from '../hooks/useStandards';
import { trackStandardEvent } from '../utils/analytics';
import { ErrorBanner } from '../components/ErrorBanner';

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

function CadenceLine({ standard }: { standard: Standard }) {
  const { interval, unit } = standard.cadence;
  const cadenceLabel =
    interval === 1 ? unit : `${interval} ${unit}${interval > 1 ? 's' : ''}`;
  return (
    <Text style={styles.historyValue}>
      Cadence: every {cadenceLabel}
    </Text>
  );
}

export function ArchivedStandardsScreen({
  onBack,
}: ArchivedStandardsScreenProps) {
  const { archivedStandards, unarchiveStandard, error } = useStandards();

  const handleUnarchive = async (standard: Standard) => {
    await unarchiveStandard(standard.id);
    trackStandardEvent('standard_unarchive', {
      standardId: standard.id,
      activityId: standard.activityId,
    });
  };

  const renderStandard = ({ item }: { item: Standard }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.activityLabel}>Activity ID {item.activityId}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Archived</Text>
        </View>
      </View>
      <Text style={styles.summary}>{item.summary}</Text>

      <View style={styles.historyBlock}>
        <Text style={styles.historyLabel}>Read-only details</Text>
        <Text style={styles.historyValue}>
          Minimum: {item.minimum} {item.unit}
        </Text>
        <CadenceLine standard={item} />
        <Text style={styles.historyValue}>
          Archived on {formatDate(item.archivedAtMs)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.logButton, styles.logButtonDisabled]}
        disabled={true}
        accessibilityRole="button"
        accessibilityLabel="Logging disabled for archives"
        accessibilityState={{ disabled: true }}
      >
        <Text style={styles.logButtonText}>Logging disabled for archives</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => handleUnarchive(item)}
        accessibilityRole="button"
      >
        <Text style={styles.secondaryButtonText}>Unarchive Standard</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Archived Standards</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ErrorBanner error={error} />

      {archivedStandards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No archived Standards</Text>
          <Text style={styles.emptySubtitle}>
            Active Standards will appear here when you archive them.
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
    backgroundColor: '#f7f8fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: '#0F62FE',
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
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
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
    color: '#555',
  },
  badge: {
    backgroundColor: '#FDECEA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#C64B30',
    fontSize: 12,
    fontWeight: '600',
  },
  summary: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  historyBlock: {
    backgroundColor: '#f4f6fb',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3c4043',
  },
  historyValue: {
    fontSize: 14,
    color: '#555',
  },
  logButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logButtonDisabled: {
    backgroundColor: '#eceff1',
  },
  logButtonText: {
    color: '#5f6368',
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#0F62FE',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0F62FE',
    fontWeight: '600',
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
    color: '#111',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
  },
});
