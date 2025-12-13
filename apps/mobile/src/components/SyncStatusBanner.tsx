import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';

// Conditionally import NetInfo if available
let NetInfo: any = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  // NetInfo not installed, will use fallback
}

export interface SyncStatusBannerProps {
  /** Whether to show the banner even when online (for testing) */
  forceShow?: boolean;
}

/**
 * Sync status banner that displays when offline or syncing.
 * Relies on Firestore's built-in offline persistence for queuing.
 */
export function SyncStatusBanner({ forceShow }: SyncStatusBannerProps) {
  const isDark = useColorScheme() === 'dark';
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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
    <View style={[styles.banner, isDark && styles.bannerDark]}>
      {isSyncing && (
        <ActivityIndicator 
          size="small" 
          color={isDark ? '#64B5F6' : '#0F62FE'} 
          style={styles.spinner}
        />
      )}
      <Text style={[styles.text, isDark && styles.textDark]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerDark: {
    backgroundColor: '#3E2E1A',
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    color: '#B06E00',
    fontSize: 14,
    flex: 1,
  },
  textDark: {
    color: '#FFC107',
  },
});
