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
    expect(result.current.cadence).toEqual({ interval: 1, unit: 'week' });
    expect(result.current.goalTotal).toBeNull();
    expect(result.current.unitOverride).toBeNull();
    expect(result.current.breakdownEnabled).toBe(false);
    expect(result.current.sessionLabel).toBe('session');
    expect(result.current.sessionsPerCadence).toBeNull();
    expect(result.current.volumePerSession).toBeNull();
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

    // No activity or goalTotal
    expect(result.current.getSummaryPreview()).toBeNull();

    act(() => {
      result.current.setSelectedActivity(mockActivity);
    });
    // Still missing goalTotal
    expect(result.current.getSummaryPreview()).toBeNull();
  });

  test('getSummaryPreview generates correct summary when all fields are set (direct mode)', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setGoalTotal(1000);
    });

    const summary = result.current.getSummaryPreview();
    expect(summary).toBe('1000 calls / week');
  });

  test('getSummaryPreview uses unit override when set', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setGoalTotal(1000);
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
      result.current.setGoalTotal(50);
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

  test('generatePayload returns correct payload when all fields are set (direct mode)', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setGoalTotal(1000);
    });

    const payload = result.current.generatePayload();
    expect(payload).toEqual({
      activityId: 'activity-1',
      minimum: 1000,
      unit: 'calls',
      cadence: { interval: 1, unit: 'week' },
      summary: '1000 calls / week',
      sessionConfig: {
        sessionLabel: 'session',
        sessionsPerCadence: 1,
        volumePerSession: 1000,
      },
    });
  });

  test('generatePayload uses unit override when set', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setGoalTotal(1000);
      result.current.setUnitOverride('minutes');
    });

    const payload = result.current.generatePayload();
    expect(payload?.unit).toBe('minutes');
    expect(payload?.summary).toBe('1000 minutes / week');
  });

  test('generatePayload returns correct payload for session-based mode', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setBreakdownEnabled(true);
      result.current.setSessionsPerCadence(5);
      result.current.setVolumePerSession(15);
      result.current.setSessionLabel('session');
    });

    expect(result.current.breakdownEnabled).toBe(true);
    expect(result.current.sessionsPerCadence).toBe(5);
    expect(result.current.volumePerSession).toBe(15);

    const payload = result.current.generatePayload();
    expect(payload).toEqual({
      activityId: 'activity-1',
      minimum: 75, // 5 * 15
      unit: 'calls',
      cadence: { interval: 1, unit: 'week' },
      summary: '5 sessions × 15 calls = 75 calls / week',
      sessionConfig: {
        sessionLabel: 'session',
        sessionsPerCadence: 5,
        volumePerSession: 15,
      },
    });
  });

  test('getSummaryPreview shows session breakdown when breakdown enabled', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setBreakdownEnabled(true);
      result.current.setSessionsPerCadence(5);
      result.current.setVolumePerSession(15);
    });

    expect(result.current.breakdownEnabled).toBe(true);
    expect(result.current.sessionsPerCadence).toBe(5);
    expect(result.current.volumePerSession).toBe(15);

    const summary = result.current.getSummaryPreview();
    expect(summary).toBe('5 sessions × 15 calls = 75 calls / week');
  });

  test('goalTotal auto-calculates when session params are provided', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setBreakdownEnabled(true);
      result.current.setSessionsPerCadence(4);
      result.current.setVolumePerSession(10);
    });

    expect(result.current.goalTotal).toBe(40);
  });

  test('goalTotal resets to null when session params become incomplete', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setBreakdownEnabled(true);
      result.current.setSessionsPerCadence(4);
      result.current.setVolumePerSession(10);
    });

    expect(result.current.goalTotal).toBe(40);

    act(() => {
      result.current.setVolumePerSession(null);
    });

    expect(result.current.goalTotal).toBeNull();
  });

  test('reset clears all state', () => {
    const { result } = renderHook(() => useStandardsBuilderStore());

    act(() => {
      result.current.setSelectedActivity(mockActivity);
      result.current.setCadence({ interval: 1, unit: 'week' });
      result.current.setGoalTotal(1000);
      result.current.setUnitOverride('minutes');
      result.current.setBreakdownEnabled(true);
      result.current.setSessionsPerCadence(5);
      result.current.setVolumePerSession(15);
      result.current.setSessionLabel('workout');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedActivity).toBeNull();
    expect(result.current.cadence).toEqual({ interval: 1, unit: 'week' });
    expect(result.current.goalTotal).toBeNull();
    expect(result.current.unitOverride).toBeNull();
    expect(result.current.breakdownEnabled).toBe(false);
    expect(result.current.sessionLabel).toBe('session');
    expect(result.current.sessionsPerCadence).toBeNull();
    expect(result.current.volumePerSession).toBeNull();
  });
});
