import { ActivityLogSlice } from '../hooks/useActivityRangeLogs';
import { DateTime } from 'luxon';

export interface DailyVolumeData {
  date: string; // ISO date string YYYY-MM-DD
  label: string; // Display label like "Mon 1/12"
  value: number;
  timestamp: number;
}

export interface DailyProgressData extends DailyVolumeData {
  cumulativeValue: number;
  goalValue: number;
  periodStartMs: number;
  periodEndMs: number;
}

/**
 * Aggregates logs into daily totals.
 */
export function aggregateDailyVolume(
  logs: ActivityLogSlice[],
  startMs: number,
  endMs: number,
  timezone: string
): DailyVolumeData[] {
  const dailyMap = new Map<string, number>();
  
  // Initialize map with all days in range
  let current = DateTime.fromMillis(startMs).setZone(timezone).startOf('day');
  const end = DateTime.fromMillis(endMs).setZone(timezone).startOf('day');
  
  while (current <= end) {
    dailyMap.set(current.toISODate()!, 0);
    current = current.plus({ days: 1 });
  }

  // Aggregate logs
  for (const log of logs) {
    const dateStr = DateTime.fromMillis(log.occurredAtMs).setZone(timezone).toISODate();
    if (dateStr && dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + log.value);
    }
  }

  // Convert to array
  return Array.from(dailyMap.entries()).map(([dateStr, value]) => {
    const dt = DateTime.fromISO(dateStr, { zone: timezone });
    return {
      date: dateStr,
      label: dt.toFormat('ccc M/d'),
      value,
      timestamp: dt.toMillis(),
    };
  });
}

/**
 * Aggregates logs into daily cumulative totals per period.
 */
export function aggregateDailyProgress(
  logs: ActivityLogSlice[],
  periods: { startMs: number; endMs: number; goal: number }[],
  timezone: string
): DailyProgressData[] {
  const result: DailyProgressData[] = [];

  for (const period of periods) {
    const periodLogs = logs.filter(
      (l) => l.occurredAtMs >= period.startMs && l.occurredAtMs < period.endMs
    );

    let current = DateTime.fromMillis(period.startMs).setZone(timezone).startOf('day');
    const end = DateTime.fromMillis(period.endMs).setZone(timezone).minus({ milliseconds: 1 }).startOf('day');
    
    let cumulative = 0;
    while (current <= end) {
      const dateStr = current.toISODate()!;
      const dayTotal = periodLogs
        .filter((l) => DateTime.fromMillis(l.occurredAtMs).setZone(timezone).toISODate() === dateStr)
        .reduce((sum, l) => sum + l.value, 0);
      
      cumulative += dayTotal;
      
      result.push({
        date: dateStr,
        label: current.toFormat('ccc M/d'),
        value: dayTotal,
        cumulativeValue: cumulative,
        goalValue: period.goal,
        periodStartMs: period.startMs,
        periodEndMs: period.endMs,
        timestamp: current.toMillis(),
      });
      
      current = current.plus({ days: 1 });
    }
  }

  return result;
}
