import { orderBy, QueryConstraint, where } from 'firebase/firestore';

export function whereNotDeleted(): QueryConstraint {
  // Soft-delete convention: deletedAt == null means active.
  return where('deletedAt', '==', null);
}

export function orderByUpdatedAtDesc(): QueryConstraint {
  return orderBy('updatedAt', 'desc');
}

export function orderByOccurredAtDesc(): QueryConstraint {
  return orderBy('occurredAt', 'desc');
}

export function whereStandardIdEquals(standardId: string): QueryConstraint {
  return where('standardId', '==', standardId);
}

export function whereStandardStateEquals(state: 'active' | 'archived'): QueryConstraint {
  return where('state', '==', state);
}

export function whereActivityIdEquals(activityId: string): QueryConstraint {
  return where('activityId', '==', activityId);
}

export function orderByPeriodStartMsDesc(): QueryConstraint {
  return orderBy('periodStartMs', 'desc');
}

export function orderByPeriodEndMsDesc(): QueryConstraint {
  return orderBy('periodEndMs', 'desc');
}
