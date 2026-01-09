export type ActivityLogMutationType = 'create' | 'update' | 'delete' | 'restore';

export interface ActivityLogMutation {
  type: ActivityLogMutationType;
  standardId: string;
  activityId?: string;
  occurredAtMs: number;
  logEntryId?: string;
}

type ActivityLogMutationListener = (mutation: ActivityLogMutation) => void;

const subscribers = new Set<ActivityLogMutationListener>();

export function subscribeToActivityLogMutations(
  listener: ActivityLogMutationListener
): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

export function emitActivityLogMutation(mutation: ActivityLogMutation): void {
  if (!mutation || typeof mutation.standardId !== 'string') {
    console.warn('[activityLogEvents] Ignoring malformed mutation payload', mutation);
    return;
  }

  subscribers.forEach((listener) => {
    try {
      listener(mutation);
    } catch (error) {
      console.error('[activityLogEvents] Listener error', error);
    }
  });
}
