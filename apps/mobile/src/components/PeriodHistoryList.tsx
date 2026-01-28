import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import type { PeriodHistoryEntry } from '../utils/standardHistory';
import { useTheme } from '../theme/useTheme';
import { CARD_LIST_GAP, SCREEN_PADDING } from '@nine4/ui-kit';

export interface PeriodHistoryListProps {
  history: PeriodHistoryEntry[];
  onPeriodPress: (entry: PeriodHistoryEntry) => void;
  contentPaddingHorizontal?: number;
}

function PeriodRow({
  item,
  theme,
  onPress,
}: {
  item: PeriodHistoryEntry;
  theme: ReturnType<typeof useTheme>;
  onPress: (entry: PeriodHistoryEntry) => void;
}) {
  const totalFormatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(item.total);

  return (
    <TouchableOpacity
      style={[styles.periodRow, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`View logs for ${item.periodLabel}`}
    >
      <View style={styles.periodRowHeader}>
        <Text style={[styles.periodLabel, { color: theme.text.secondary }]}>
          {item.periodLabel}
        </Text>
      </View>
      <Text style={[styles.summaryText, { color: theme.text.primary }]}>
        {totalFormatted} / {item.targetSummary}
      </Text>
      <View style={[styles.progressBar, { backgroundColor: theme.background.tertiary }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${item.progressPercent}%`, backgroundColor: item.progressPercent >= 100 ? theme.status.met.barComplete : theme.status.met.bar },
          ]}
          accessibilityRole="progressbar"
          accessibilityValue={{ now: item.progressPercent, min: 0, max: 100 }}
        />
      </View>
    </TouchableOpacity>
  );
}

const Separator = () => <View style={styles.separator} />;

export function PeriodHistoryList({
  history,
  onPeriodPress,
  contentPaddingHorizontal = SCREEN_PADDING,
}: PeriodHistoryListProps) {
  const theme = useTheme();

  const renderItem = ({ item }: { item: PeriodHistoryEntry }) => (
    <PeriodRow item={item} theme={theme} onPress={onPeriodPress} />
  );

  return (
    <FlatList
      data={history}
      renderItem={renderItem}
      keyExtractor={(item) => `${item.periodStartMs}-${item.periodEndMs}`}
      scrollEnabled={false}
      ItemSeparatorComponent={Separator}
      contentContainerStyle={{ paddingHorizontal: contentPaddingHorizontal }}
    />
  );
}

const styles = StyleSheet.create({
  periodRow: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  periodRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  separator: {
    height: CARD_LIST_GAP,
  },
});
