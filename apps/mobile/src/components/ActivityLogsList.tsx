import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { ActivityLogEntry } from './ActivityLogEntry';
import { ActivityLog } from '../hooks/useStandardPeriodActivityLogs';
import { useTheme } from '../theme/useTheme';

export interface ActivityLogsListProps {
  logs: ActivityLog[];
  loading: boolean;
  hasMore: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onEditLog?: (log: ActivityLog) => void;
  onDeleteLog?: (log: ActivityLog) => void;
  unit: string;
}

export function ActivityLogsList({
  logs,
  loading,
  hasMore,
  onRefresh,
  onLoadMore,
  onEditLog,
  onDeleteLog,
  unit,
}: ActivityLogsListProps) {
  const theme = useTheme();

  const renderItem = useCallback(({ item }: { item: ActivityLog }) => (
    <ActivityLogEntry
      value={item.value}
      unit={unit}
      occurredAtMs={item.occurredAtMs}
      note={item.note}
      onEdit={onEditLog ? () => onEditLog(item) : undefined}
      onDelete={onDeleteLog ? () => onDeleteLog(item) : undefined}
    />
  ), [unit, onEditLog, onDeleteLog]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
        No activity logs yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
        Activity logs for this period will appear here.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore || !loading) {
      return null;
    }

    return (
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.text.secondary }]}>
          Loading more...
        </Text>
      </View>
    );
  };

  const keyExtractor = (item: ActivityLog) => item.id;

  const handleEndReached = () => {
    if (hasMore && !loading) {
      onLoadMore();
    }
  };

  return (
    <FlatList
      data={logs}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      refreshControl={
        <RefreshControl
          refreshing={false} // We handle loading state separately
          onRefresh={onRefresh}
          tintColor={theme.activityIndicator}
        />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.1}
      contentContainerStyle={logs.length === 0 ? styles.emptyContentContainer : styles.contentContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 16,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});