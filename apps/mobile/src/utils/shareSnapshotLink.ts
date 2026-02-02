import { NativeModules, Platform, Share } from 'react-native';

type ShareLinkPreviewModule = {
  share: (options: { url: string; title: string; message?: string }) => Promise<{ completed: boolean }>;
};

const ShareLinkPreview = NativeModules.ShareLinkPreview as ShareLinkPreviewModule | undefined;

export async function shareSnapshotLink(options: { url: string; snapshotTitle: string }) {
  const message = `Try my "${options.snapshotTitle}" snapshot on Minimum Standards: ${options.url}`;

  if (Platform.OS === 'ios' && ShareLinkPreview?.share) {
    // Title is what iOS uses for the rich link preview.
    await ShareLinkPreview.share({
      url: options.url,
      title: `${options.snapshotTitle} — Minimum Standards`,
      message,
    });
    return;
  }

  await Share.share({ message });
}

