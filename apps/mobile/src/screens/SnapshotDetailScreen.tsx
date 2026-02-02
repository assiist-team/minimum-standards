import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/useTheme';
import { getScreenContainerStyle } from '@nine4/ui-kit';
import { useSnapshots } from '../hooks/useSnapshots';
import { buildSnapshotShareUrl } from '../utils/snapshotLinks';
import type { SettingsStackParamList } from '../navigation/types';
import type { ShareLinkRecord } from '../types/snapshots';

export function SnapshotDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const route = useRoute<RouteProp<SettingsStackParamList, 'SnapshotDetail'>>();
  const {
    snapshots,
    toggleSnapshotEnabled,
    getOrCreateShareLink,
    regenerateShareLink,
    fetchShareLinkForSnapshot,
    deleteSnapshot,
  } = useSnapshots();
  const [shareLink, setShareLink] = useState<ShareLinkRecord | null>(null);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const snapshot = useMemo(
    () => snapshots.find((item) => item.id === route.params.snapshotId) ?? null,
    [snapshots, route.params.snapshotId]
  );

  useEffect(() => {
    if (!snapshot) {
      return;
    }
    fetchShareLinkForSnapshot(snapshot.id)
      .then((link) => setShareLink(link))
      .catch(() => {
        setShareLink(null);
      });
  }, [snapshot, fetchShareLinkForSnapshot]);

  const handleShare = async () => {
    if (!snapshot) {
      return;
    }
    setSharing(true);
    try {
      if (!snapshot.isEnabled) {
        Alert.alert('Sharing disabled', 'Turn on sharing to use this link.');
        return;
      }
      const link = await getOrCreateShareLink(snapshot.id);
      setShareLink(link);
      const url = buildSnapshotShareUrl(link.shareCode);
      await Share.share({
        message: `Try my snapshot on Minimum Standards: ${url}`,
      });
    } catch (error) {
      Alert.alert(
        'Share failed',
        error instanceof Error ? error.message : 'Unable to share snapshot'
      );
    } finally {
      setSharing(false);
    }
  };

  const confirmDelete = () => {
    if (!snapshot || deleting) {
      return;
    }
    Alert.alert(
      'Delete snapshot?',
      'This removes the snapshot and disables its share link. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteSnapshot(snapshot.id);
              Alert.alert('Snapshot deleted', 'The snapshot was removed.');
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                'Delete failed',
                error instanceof Error ? error.message : 'Unable to delete snapshot'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleRegenerate = async () => {
    if (!shareLink) {
      return;
    }
    if (!snapshot?.isEnabled) {
      Alert.alert('Sharing disabled', 'Turn on sharing to regenerate this link.');
      return;
    }
    try {
      const updated = await regenerateShareLink(shareLink.id);
      setShareLink(updated);
      Alert.alert('Link regenerated', 'Your old link is now disabled.');
    } catch (error) {
      Alert.alert(
        'Regenerate failed',
        error instanceof Error ? error.message : 'Unable to regenerate link'
      );
    }
  };

  if (!snapshot) {
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
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Snapshot</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.button.primary.background} />
        </View>
      </View>
    );
  }

  const standardCount = snapshot.payload.standards.length;
  const activityCount = snapshot.payload.activities.length;
  const categoryCount = snapshot.payload.categories.length;
  const shareUrl =
    shareLink && shareLink.disabledAtMs == null
      ? buildSnapshotShareUrl(shareLink.shareCode)
      : null;
  const shareDisabled = sharing || !snapshot.isEnabled;

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
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{snapshot.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.section, { backgroundColor: theme.background.surface, borderColor: theme.border.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Summary</Text>
          <Text style={[styles.summaryText, { color: theme.text.primary }]}>
            {standardCount} standards · {activityCount} activities · {categoryCount} categories
          </Text>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: theme.text.primary }]}>Shareable</Text>
            <TouchableOpacity
              onPress={() => toggleSnapshotEnabled(snapshot.id, !snapshot.isEnabled)}
              style={styles.toggleContainer}
              accessibilityRole="switch"
              accessibilityState={{ checked: snapshot.isEnabled }}
            >
              <View
                style={[
                  styles.toggle,
                  {
                    backgroundColor: snapshot.isEnabled
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
                      transform: [{ translateX: snapshot.isEnabled ? 20 : 0 }],
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.background.surface, borderColor: theme.border.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Edit</Text>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.border.secondary }]}
            onPress={() => navigation.navigate('SnapshotEdit', { snapshotId: snapshot.id })}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text.primary }]}>Edit snapshot</Text>
          </TouchableOpacity>
          <Text style={[styles.helperText, { color: theme.text.secondary }]}>
            Edits update the existing share link automatically.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.background.surface, borderColor: theme.border.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Share link</Text>
          {shareUrl ? (
            <Text style={[styles.shareLink, { color: theme.text.primary }]}>{shareUrl}</Text>
          ) : (
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
              {shareLink?.disabledAtMs
                ? 'Link disabled. Tap Share to create a new one.'
                : 'No link yet. Tap Share to create one.'}
            </Text>
          )}
          {!snapshot.isEnabled && (
            <Text style={[styles.helperText, { color: theme.text.secondary }]}>
              Turn on sharing to use this link.
            </Text>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.button.primary.background },
                shareDisabled && styles.primaryButtonDisabled,
              ]}
              onPress={handleShare}
              disabled={shareDisabled}
            >
              {sharing ? (
                <ActivityIndicator size="small" color={theme.button.primary.text} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: theme.button.primary.text }]}>
                  Share
                </Text>
              )}
            </TouchableOpacity>
            {shareLink && (
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border.secondary }]}
                onPress={handleRegenerate}
                disabled={shareDisabled}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text.primary }]}>
                  Regenerate link
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.background.surface, borderColor: theme.border.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Delete</Text>
          <TouchableOpacity
            style={[
              styles.dangerButton,
              { backgroundColor: theme.button.destructive.background },
              deleting && styles.primaryButtonDisabled,
            ]}
            onPress={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={theme.button.primary.text} />
            ) : (
              <Text style={[styles.dangerButtonText, { color: theme.button.destructive.text }]}>
                Delete snapshot
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    gap: 16,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
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
  shareLink: {
    fontSize: 14,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  helperText: {
    marginTop: 10,
    fontSize: 12,
  },
  dangerButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
