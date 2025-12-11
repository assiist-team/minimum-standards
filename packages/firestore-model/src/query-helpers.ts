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
