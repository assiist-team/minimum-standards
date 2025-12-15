import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { getOptionalNetInfo } from '../utils/optionalNetInfo';

export interface SyncStatusBannerProps {
  /** Whether to show the banner even when online (for testing) */
  forceShow?: boolean;
}

/**
 * Sync status banner that displays when offline or syncing.
 * Relies on Firestore's built-in offline persistence for queuing.
 */
export function SyncStatusBanner({ forceShow }: SyncStatusBannerProps) {
  const theme = useTheme();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const NetInfo = getOptionalNetInfo();

  useEffect(() => {
    if (!NetInfo) {
      // NetInfo not available, assume online
      setIsConnected(true);
      return;
    }

    // Get initial state
    NetInfo.fetch().then((state: any) => {
      setIsConnected(state.isConnected);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setIsConnected(state.isConnected);
      
      // When coming back online, show syncing state briefly
      if (state.isConnected && !isConnected) {
        setIsSyncing(true);
        // Simulate sync completion after a delay
        // In reality, Firestore handles this automatically
        setTimeout(() => {
          setIsSyncing(false);
        }, 2000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  // Don't show banner if online and not syncing (unless forced)
  if (!forceShow && isConnected && !isSyncing) {
    return null;
  }

  const isOffline = isConnected === false;
  const message = isSyncing 
    ? 'Syncing changes...' 
    : isOffline 
    ? 'You are offline. Changes will sync when you reconnect.' 
    : 'Checking connection...';

  return (
    <View style={[styles.banner, { backgroundColor: theme.status.inProgress.background }]}>
      {isSyncing && (
        <ActivityIndicator 
          size="small" 
          color={theme.activityIndicator} 
          style={styles.spinner}
        />
      )}
      <Text style={[styles.text, { color: theme.status.inProgress.text }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 12,
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    flex: 1,
  },
});
