import {
  orderByOccurredAtDesc,
  orderByUpdatedAtDesc,
  whereNotDeleted,
  whereStandardIdEquals,
  whereStandardStateEquals
} from '../src/query-helpers';

function describeConstraint(c: unknown): string {
  // Firebase QueryConstraint objects expose a `type` discriminator.
  // We keep these tests narrow: assert the intended constraint type.
  return (c as any).type;
}

describe('query helpers', () => {
  test('whereNotDeleted uses where constraint', () => {
    expect(describeConstraint(whereNotDeleted())).toBe('where');
  });

  test('orderByUpdatedAtDesc uses orderBy constraint', () => {
    expect(describeConstraint(orderByUpdatedAtDesc())).toBe('orderBy');
  });

  test('orderByOccurredAtDesc uses orderBy constraint', () => {
    expect(describeConstraint(orderByOccurredAtDesc())).toBe('orderBy');
  });

  test('whereStandardIdEquals uses where constraint', () => {
    expect(describeConstraint(whereStandardIdEquals('s1'))).toBe('where');
  });

  test('whereStandardStateEquals uses where constraint', () => {
    expect(describeConstraint(whereStandardStateEquals('active'))).toBe('where');
  });
});
