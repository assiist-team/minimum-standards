import { Timestamp } from 'firebase/firestore';
import { timestampToMs } from '../src/timestamps';

describe('timestamp normalization', () => {
  test('Timestamp -> ms', () => {
    const ts = Timestamp.fromMillis(1234);
    expect(timestampToMs(ts)).toBe(1234);
  });

  test('Date -> ms', () => {
    const d = new Date(2000);
    expect(timestampToMs(d)).toBe(2000);
  });
});
