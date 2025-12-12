import { activityLogSchema, activitySchema, standardSchema } from '../src/schemas';

describe('shared Zod schemas', () => {
  test('Activity happy path', () => {
    const parsed = activitySchema.parse({
      id: 'a1',
      name: 'Sales Calls',
      unit: 'calls',
      inputType: 'number',
      createdAtMs: 1,
      updatedAtMs: 2,
      deletedAtMs: null
    });

    expect(parsed.name).toBe('Sales Calls');
    expect(parsed.unit).toBe('calls');
  });

  test('Activity normalizes singular unit to plural', () => {
    const parsed = activitySchema.parse({
      id: 'a1',
      name: 'Sales Calls',
      unit: 'call',
      inputType: 'number',
      createdAtMs: 1,
      updatedAtMs: 2,
      deletedAtMs: null
    });

    expect(parsed.unit).toBe('calls');
  });

  test('Activity rejects empty name', () => {
    expect(() =>
      activitySchema.parse({
        id: 'a1',
        name: '',
        unit: 'calls',
        inputType: 'number',
        createdAtMs: 1,
        updatedAtMs: 2,
        deletedAtMs: null
      })
    ).toThrow();
  });

  test('Standard happy path', () => {
    const parsed = standardSchema.parse({
      id: 's1',
      activityId: 'a1',
      minimum: 100,
      unit: 'calls',
      cadence: 'weekly',
      state: 'active',
      createdAtMs: 1,
      updatedAtMs: 2,
      deletedAtMs: null
    });

    expect(parsed.minimum).toBe(100);
  });

  test('ActivityLog happy path', () => {
    const parsed = activityLogSchema.parse({
      id: 'l1',
      standardId: 's1',
      value: 14,
      occurredAtMs: 123,
      note: 'morning',
      editedAtMs: null,
      createdAtMs: 1,
      updatedAtMs: 2,
      deletedAtMs: null
    });

    expect(parsed.value).toBe(14);
  });

  test('ActivityLog rejects negative value', () => {
    expect(() =>
      activityLogSchema.parse({
        id: 'l1',
        standardId: 's1',
        value: -1,
        occurredAtMs: 123,
        note: null,
        editedAtMs: null,
        createdAtMs: 1,
        updatedAtMs: 2,
        deletedAtMs: null
      })
    ).toThrow();
  });
});
