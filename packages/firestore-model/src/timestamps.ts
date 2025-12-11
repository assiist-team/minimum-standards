import { Timestamp } from 'firebase/firestore';

export function timestampToMs(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  throw new Error('Unsupported timestamp value');
}

export function msToTimestamp(value: number): Timestamp {
  return Timestamp.fromMillis(value);
}
