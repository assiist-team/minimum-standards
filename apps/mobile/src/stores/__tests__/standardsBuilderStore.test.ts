import { renderHook, act } from '@testing-library/react-native';
import { useStandardsBuilderStore } from '../standardsBuilderStore';
import { Activity } from '@minimum-standards/shared-model';

const mockActivity: Activity = {
  id: 'activity-1',
  name: 'Sales Calls',
  unit: 'calls',
  createdAtMs: 1000,
  updatedAtMs: 2000,
  deletedAtMs: null,
};

describe('standardsBuilderStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useStandardsBuilderStore());
    act(() => {
      result.current.reset();
    });
  });

  test('initial state is correct', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    expect(result.current.selectedActivity).toBeNull();
    expect(result.current.cadence).toBeNull();
    expect(result.current.minimum).toBeNull();
    expect(result.current.unitOverride).toBeNull();
    expect(result.current.isArchived).toBe(false);
    expect(result.current.getSummaryPreview()).toBeNull();
  });

  test('setSelectedActivity updates selected activity and resets unit override', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
    });

    expect(result.current.selectedActivity).toEqual(mockActivity);
    expect(result.current.unitOverride).toBeNull();
  });

  test('getEffectiveUnit returns Activity unit when no override', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
    });

    expect(result.current.getEffectiveUnit()).toBe('calls');
  });

  test('getEffectiveUnit returns override when set', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setUnitOverride('minutes');
    });

    expect(result.current.getEffectiveUnit()).toBe('minutes');
  });

  test('getSummaryPreview returns null when required fields are missing', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    // No activity, cadence, or minimum
    expect(result.current.getSummaryPreview()).toBeNull();

    act(() => {
      result.current.setSelectedActivity(mockActivity);
    });
    // Still missing cadence and minimum
    expect(result.current.getSummaryPreview()).toBeNull();

    act(() => {
      result.current.setCadence({ interval: 1, unit: 'week' });
    });
    // Still missing minimum
    expect(result.current.getSummaryPreview()).toBeNull();
  });

  test('getSummaryPreview generates correct summary when all fields are set', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setMinimum(1000);
    });

    const summary = result.current.getSummaryPreview();
    expect(summary).toBe('1000 calls / week');
  });

  test('getSummaryPreview uses unit override when set', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setMinimum(1000);
      result.current.setUnitOverride('minutes');
    });

    const summary = result.current.getSummaryPreview();
    expect(summary).toBe('1000 minutes / week');
  });

  test('getSummaryPreview handles custom cadence intervals', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 2, unit: 'day' });
      result.current.setMinimum(50);
    });

    const summary = result.current.getSummaryPreview();
    expect(summary).toBe('50 calls / 2 days');
  });

  test('generatePayload returns null when required fields are missing', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    expect(result.current.generatePayload()).toBeNull();

    act(() => {
      result.current.setSelectedActivity(mockActivity);
    });
    expect(result.current.generatePayload()).toBeNull();
  });

  test('generatePayload returns correct payload when all fields are set', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setMinimum(1000);
    });

    const payload = result.current.generatePayload();
    expect(payload).toEqual({
      activityId: 'activity-1',
      minimum: 1000,
      unit: 'calls',
      cadence: { interval: 1, unit: 'week' },
      summary: '1000 calls / week',
    });
  });

  test('generatePayload uses unit override when set', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setMinimum(1000);
      result.current.setUnitOverride('minutes');
    });

    const payload = result.current.generatePayload();
    expect(payload?.unit).toBe('minutes');
    expect(payload?.summary).toBe('1000 minutes / week');
  });

  test('setIsArchived updates archive state', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setIsArchived(true);
    });

    expect(result.current.isArchived).toBe(true);

    act(() => {
      result.current.setIsArchived(false);
    });

    expect(result.current.isArchived).toBe(false);
  });

  test('reset clears all state', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setMinimum(1000);
      result.current.setUnitOverride('minutes');
      result.current.setIsArchived(true);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedActivity).toBeNull();
    expect(result.current.cadence).toBeNull();
    expect(result.current.minimum).toBeNull();
    expect(result.current.unitOverride).toBeNull();
    expect(result.current.isArchived).toBe(false);
  });
});
