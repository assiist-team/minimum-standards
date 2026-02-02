import { useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useSnapshotShareStore } from '../stores/snapshotShareStore';
import { extractShareCodeFromUrl } from '../utils/snapshotLinks';
import { importSnapshotForUser, SnapshotImportError } from '../utils/snapshotImport';

export function useSnapshotImportFlow() {
  const { user } = useAuthStore();
  const { pendingShareCode, setPendingShareCode, clearPendingShareCode } =
    useSnapshotShareStore();
  const [isImporting, setIsImporting] = useState(false);
  const lastImportedRef = useRef<string | null>(null);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) {
        return;
      }
      const shareCode = extractShareCodeFromUrl(url);
      if (shareCode) {
        setPendingShareCode(shareCode);
      }
    };

    Linking.getInitialURL()
      .then((url) => handleUrl(url))
      .catch(() => {
        // ignore
      });

    const listener = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => listener.remove();
  }, [setPendingShareCode]);

  useEffect(() => {
    if (!user?.uid || !pendingShareCode || isImporting) {
      return;
    }
    if (lastImportedRef.current === pendingShareCode) {
      return;
    }

    const runImport = async () => {
      setIsImporting(true);
      try {
        const result = await importSnapshotForUser({
          userId: user.uid,
          shareCode: pendingShareCode,
        });

        lastImportedRef.current = pendingShareCode;
        clearPendingShareCode();

        if (result.alreadyInstalled) {
          Alert.alert('Snapshot already installed', 'You already have this snapshot.');
          return;
        }

        Alert.alert(
          'Snapshot imported',
          `Added ${result.createdCounts.standards} standards from the snapshot.`
        );
      } catch (error) {
        const shareCode = pendingShareCode;
        clearPendingShareCode();
        let title = 'Import failed';
        let message = error instanceof Error ? error.message : 'Unable to import snapshot';
        let canRetry = true;

        if (error instanceof SnapshotImportError) {
          switch (error.code) {
            case 'share-link-not-found':
              title = 'Link not found';
              message = 'This share link is invalid or has expired.';
              canRetry = false;
              break;
            case 'share-link-disabled':
              title = 'Link disabled';
              message = 'This share link has been turned off.';
              canRetry = false;
              break;
            case 'snapshot-not-found':
              title = 'Snapshot missing';
              message = 'This snapshot is no longer available.';
              canRetry = false;
              break;
            case 'snapshot-deleted':
              title = 'Snapshot deleted';
              message = 'This snapshot was removed by the owner.';
              canRetry = false;
              break;
            case 'snapshot-disabled':
              title = 'Snapshot disabled';
              message = 'This snapshot is not shareable right now.';
              canRetry = false;
              break;
            case 'payload-missing':
            case 'payload-invalid':
            case 'payload-empty':
              title = 'Snapshot unavailable';
              message = 'This snapshot is missing data needed to import.';
              canRetry = false;
              break;
            default:
              break;
          }
        }

        if (canRetry) {
          Alert.alert(title, message, [
            { text: 'Try again', onPress: () => setPendingShareCode(shareCode) },
            { text: 'Dismiss', style: 'cancel' },
          ]);
        } else {
          Alert.alert(title, message);
        }
      } finally {
        setIsImporting(false);
      }
    };

    void runImport();
  }, [user?.uid, pendingShareCode, isImporting, clearPendingShareCode]);
}
