import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Standard } from '@minimum-standards/shared-model';
import { useStandardsLibrary } from '../hooks/useStandardsLibrary';
import { useActivities } from '../hooks/useActivities';
import { ErrorBanner } from '../components/ErrorBanner';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface StandardsLibraryScreenProps {
  onBack?: () => void; // Optional - not shown on main screen
  onSelectStandard?: (standard: Standard) => void; // For builder context
  onNavigateToBuilder?: () => void; // Navigate to Standards Builder
}

type Tab = 'active' | 'archived';

const CARD_SPACING = 16;

export function StandardsLibraryScreen({
  onBack,
  onSelectStandard,
  onNavigateToBuilder,
}: StandardsLibraryScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    activeStandards,
    archivedStandards,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    archiveStandard,
    unarchiveStandard,
  } = useStandardsLibrary();

  const { activities } = useActivities();
  const [activeTab, setActiveTab] = useState<Tab>('active');

  // Create activity lookup map
  const activityMap = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach((activity) => {
      map.set(activity.id, activity.name);
    });
    return map;
  }, [activities]);

  const currentStandards =
    activeTab === 'active' ? activeStandards : archivedStandards;

  const handleArchive = async (standardId: string) => {
    try {
      await archiveStandard(standardId);
    } catch (err) {
      // Error handling - could show toast/alert
      console.error('Failed to archive standard:', err);
    }
  };

  const handleActivate = async (standardId: string) => {
    try {
      await unarchiveStandard(standardId);
    } catch (err) {
      // Error handling - could show toast/alert
      console.error('Failed to activate standard:', err);
    }
  };

  const handleSelect = useCallback((standard: Standard) => {
    if (onSelectStandard) {
      onSelectStandard(standard);
      if (onBack) {
        onBack();
      }
    }
  }, [onSelectStandard, onBack]);

  const handleRetry = useCallback(() => {
    // Refresh standards if needed
  }, []);

  const renderCard = useCallback(
    ({ item }: { item: Standard }) => (
      <StandardCard
        standard={item}
        onSelect={() => handleSelect(item)}
        onArchive={() => handleArchive(item.id)}
        onActivate={() => handleActivate(item.id)}
        activityNameMap={activityMap}
        onSelectStandard={onSelectStandard}
      />
    ),
    [handleSelect, handleArchive, handleActivate, activityMap, onSelectStandard]
  );

  const content = useMemo(() => {
    if (loading && currentStandards.length === 0) {
      return (
        <View style={styles.skeletonContainer} testID="library-skeletons">
          {[0, 1, 2].map((key) => (
            <View key={key} style={[styles.skeletonCard, { backgroundColor: theme.background.card }]}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.background.tertiary }]} />
              <View style={[styles.skeletonLineShort, { backgroundColor: theme.background.tertiary }]} />
            </View>
          ))}
        </View>
      );
    }

    if (currentStandards.length === 0) {
      return (
        <View style={styles.emptyContainer} testID="library-empty-state">
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
            {searchQuery.trim()
              ? 'No standards match your search'
              : 'No standards'}
          </Text>
          {!searchQuery.trim() && onNavigateToBuilder && (
            <TouchableOpacity
              onPress={onNavigateToBuilder}
              style={[styles.builderButton, { backgroundColor: theme.button.primary.background }]}
              accessibilityRole="button"
            >
              <Text style={[styles.builderButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>Create Standard</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        testID="library-list"
        data={currentStandards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRetry} />
        }
      />
    );
  }, [
    currentStandards,
    loading,
    onNavigateToBuilder,
    renderCard,
    searchQuery,
    theme,
    handleRetry,
  ]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background.primary }]}>
      <View style={[styles.header, { backgroundColor: theme.background.secondary, borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} accessibilityRole="button">
            <Text style={[styles.backButton, { color: theme.primary.main }]}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Standards Library</Text>
        {onNavigateToBuilder ? (
          <TouchableOpacity
            onPress={onNavigateToBuilder}
            style={[styles.headerButton, { backgroundColor: theme.button.primary.background }]}
            accessibilityRole="button"
          >
            <Text style={[styles.headerButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>+ New</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ErrorBanner error={error} onRetry={handleRetry} />

      {/* Search Input */}
      <View style={[styles.searchContainer, { borderBottomColor: theme.border.secondary, backgroundColor: theme.background.secondary }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.input.background,
              borderColor: theme.input.border,
              color: theme.input.text,
            },
          ]}
          placeholder="Search standards..."
          placeholderTextColor={theme.input.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Standards search input"
        />
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.border.secondary, backgroundColor: theme.background.secondary }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'active' && { borderBottomColor: theme.link },
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'active' ? theme.link : theme.text.secondary },
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'archived' && { borderBottomColor: theme.link },
          ]}
          onPress={() => setActiveTab('archived')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'archived' ? theme.link : theme.text.secondary },
            ]}
          >
            Archived
          </Text>
        </TouchableOpacity>
      </View>

      {content}
    </View>
  );
}

function StandardCard({
  standard,
  onSelect,
  onArchive,
  onActivate,
  activityNameMap,
  onSelectStandard,
}: {
  standard: Standard;
  onSelect: () => void;
  onArchive: () => void;
  onActivate: () => void;
  activityNameMap: Map<string, string>;
  onSelectStandard?: (standard: Standard) => void;
}) {
  const theme = useTheme();
  const isActive = standard.state === 'active' && standard.archivedAtMs === null;
  
  // Get activity name from map, fallback to activityId if not found
  const activityName = activityNameMap.get(standard.activityId) ?? standard.activityId;
  
  // Format volume/period: "75 minutes / week"
  const { interval, unit: cadenceUnit } = standard.cadence;
  const cadenceStr = interval === 1 ? cadenceUnit : `${interval} ${cadenceUnit}s`;
  const volumePeriodText = `${standard.minimum} ${standard.unit} / ${cadenceStr}`;
  
  // Format session params: "5 sessions × 15 minutes"
  const sessionConfig = standard.sessionConfig;
  const sessionLabelPlural = sessionConfig.sessionsPerCadence === 1 
    ? sessionConfig.sessionLabel 
    : `${sessionConfig.sessionLabel}s`;
  const sessionParamsText = `${sessionConfig.sessionsPerCadence} ${sessionLabelPlural} × ${sessionConfig.volumePerSession} ${standard.unit}`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}
      onPress={onSelectStandard ? onSelect : undefined}
      activeOpacity={onSelectStandard ? 0.7 : 1}
      accessibilityRole={onSelectStandard ? 'button' : undefined}
      accessibilityLabel={onSelectStandard ? `Select ${activityName}` : undefined}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.titleBlock}>
            <Text
              style={[styles.activityName, { color: theme.text.primary }]}
              numberOfLines={1}
              accessibilityLabel={`Activity ${activityName}`}
            >
              {activityName}
            </Text>
            <Text
              style={[styles.volumePeriodText, { color: theme.text.primary }]}
              numberOfLines={1}
              accessibilityLabel={`Volume: ${volumePeriodText}`}
            >
              {volumePeriodText}
            </Text>
            <Text
              style={[styles.sessionParamsText, { color: theme.text.secondary }]}
              numberOfLines={1}
              accessibilityLabel={`Session params: ${sessionParamsText}`}
            >
              {sessionParamsText}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {isActive ? (
              <TouchableOpacity
                onPress={onArchive}
                style={[styles.actionButtonHeader, { backgroundColor: theme.archive.background }]}
                accessibilityRole="button"
                accessibilityLabel={`Archive ${activityName}`}
              >
                <MaterialIcons name="archive" size={20} color={theme.archive.text} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={onActivate}
                style={[styles.actionButtonHeader, { backgroundColor: theme.button.primary.background }]}
                accessibilityRole="button"
                accessibilityLabel={`Activate ${activityName}`}
              >
                <MaterialIcons name="unarchive" size={20} color={theme.button.primary.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
    paddingHorizontal: CARD_SPACING,
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
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  headerButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  searchContainer: {
    padding: CARD_SPACING,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: CARD_SPACING,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  skeletonContainer: {
    padding: CARD_SPACING,
    gap: CARD_SPACING,
  },
  skeletonCard: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
  },
  skeletonLineShort: {
    height: 16,
    width: '60%',
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  builderButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  builderButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  listContent: {
    padding: CARD_SPACING,
    gap: CARD_SPACING,
  },
  card: {
    borderRadius: 16,
    padding: 0,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  volumePeriodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sessionParamsText: {
    fontSize: 13,
  },
  headerActions: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  actionButtonHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
