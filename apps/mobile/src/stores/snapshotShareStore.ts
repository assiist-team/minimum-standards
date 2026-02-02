import { create } from 'zustand';

type SnapshotShareState = {
  pendingShareCode: string | null;
  setPendingShareCode: (shareCode: string) => void;
  clearPendingShareCode: () => void;
};

export const useSnapshotShareStore = create<SnapshotShareState>((set) => ({
  pendingShareCode: null,
  setPendingShareCode: (shareCode) => {
    set({ pendingShareCode: shareCode });
  },
  clearPendingShareCode: () => {
    set({ pendingShareCode: null });
  },
}));
