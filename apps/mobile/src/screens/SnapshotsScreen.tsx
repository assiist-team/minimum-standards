import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/useTheme';
import { getScreenContainerStyle } from '@nine4/ui-kit';
import { useSnapshots } from '../hooks/useSnapshots';
import type { SettingsStackParamList } from '../navigation/types';

export function SnapshotsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { snapshots, loading, error, toggleSnapshotEnabled } = useSnapshots();

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleToggle = useCallback(
    async (snapshotId: string, nextEnabled: boolean) => {
      try {
        await toggleSnapshotEnabled(snapshotId, nextEnabled);
      } catch (err) {
        console.error('[SnapshotsScreen] Failed to toggle snapshot', err);
      }
    },
    [toggleSnapshotEnabled]
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.background.chrome,
              borderBottomColor: theme.border.secondary,
              paddingTop: Math.max(insets.top, 12),
            },
          ]}
        >
          <TouchableOpacity onPress={handleBack} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Snapshots</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.button.primary.background} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, getScreenContainerStyle(theme)]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background.chrome,
            borderBottomColor: theme.border.secondary,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Snapshots</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.section, { backgroundColor: theme.background.surface, borderColor: theme.border.secondary }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>My Snapshots</Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.button.primary.background }]}
              onPress={() => navigation.navigate('SnapshotCreate')}
            >
              <Text style={[styles.createButtonText, { color: theme.button.primary.text }]}>Create</Text>
            </TouchableOpacity>
          </View>

          {snapshots.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
              No snapshots yet.
            </Text>
          ) : (
            snapshots.map((snapshot, index) => {
              const standardCount = snapshot.payload.standards.length;
              const activityCount = snapshot.payload.activities.length;
              const categoryCount = snapshot.payload.categories.length;
              const isEnabled = snapshot.isEnabled;
              return (
                <TouchableOpacity
                  key={snapshot.id}
                  style={[
                    styles.row,
                    index !== snapshots.length - 1 && { borderBottomColor: theme.border.secondary },
                  ]}
                  onPress={() => navigation.navigate('SnapshotDetail', { snapshotId: snapshot.id })}
                >
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowTitle, { color: theme.text.primary }]}>{snapshot.title}</Text>
                    <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                      {standardCount} standards · {activityCount} activities · {categoryCount} categories
                    </Text>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      onPress={() => handleToggle(snapshot.id, !isEnabled)}
                      style={styles.toggleContainer}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: isEnabled }}
                    >
                      <View
                        style={[
                          styles.toggle,
                          {
                            backgroundColor: isEnabled
                              ? theme.button.primary.background
                              : theme.input.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.toggleThumb,
                            {
                              backgroundColor: theme.background.primary,
                              transform: [{ translateX: isEnabled ? 20 : 0 }],
                            },
                          ]}
                        />
                      </View>
                    </TouchableOpacity>
                    <MaterialIcons name="chevron-right" size={24} color={theme.text.secondary} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.background.card }]}>
            <Text style={[styles.errorText, { color: theme.input.borderError }]}>{error.message}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Style comes from getScreenContainerStyle helper
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowInfo: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    fontSize: 14,
  },
});
