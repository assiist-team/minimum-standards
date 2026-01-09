import React, { useMemo, useState, useRef, useEffect, useCallback, useId } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  UIManager,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { DateTime } from 'luxon';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/useTheme';
import { DailyVolumeData, DailyProgressData } from '../utils/activityCharts';
import { useUIPreferencesStore, ChartType } from '../stores/uiPreferencesStore';
import { trackStandardEvent } from '../utils/analytics';
import { formatTotal } from '../utils/activityHistory';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CHART_TYPES: ChartType[] = [
  'Cumulative Volume',
  'Period Progress',
  // Temporarily disabled charts – keep references for quick re-enable
  // 'Standards Progress',
  // 'Daily Volume',
  // 'Daily Progress',
];

const CHART_DESCRIPTIONS: Record<ChartType, string> = {
  'Cumulative Volume': 'Total volume over time',
  'Period Progress': 'Total volume per period',
  'Standards Progress': 'Your minimum standards over time.',
  'Daily Volume': 'Total volume per day',
  'Daily Progress': 'Cumulative daily volume per period',
};

export interface ActivityVolumeChartsProps {
  dailyVolume: DailyVolumeData[];
  dailyProgress: DailyProgressData[];
  periodProgress: { label: string; actual: number; goal: number; status: string; periodStartMs?: number }[];
  standardsProgress: { label: string; value: number; periodStartMs?: number }[];
  cumulativeVolume: { label: string; value: number; date: string; timestamp: number }[];
  unit: string;
  onSelectPeriod?: (periodStartMs: number) => void;
}

export function ActivityVolumeCharts({
  dailyVolume,
  dailyProgress,
  periodProgress,
  standardsProgress,
  cumulativeVolume,
  unit,
  onSelectPeriod,
}: ActivityVolumeChartsProps) {
  const { preferredActivityChart: selectedChart, setPreferredActivityChart: setSelectedChart } = useUIPreferencesStore();
  const [tooltip, setTooltip] = useState<{ title: string; body: string; periodStartMs?: number } | null>(null);
  const theme = useTheme();
  
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});

  useEffect(() => {
    const layout = tabLayouts.current[selectedChart];
    if (layout && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: layout.x - 16, // Center a bit with some padding
        animated: true,
      });
    }
  }, [selectedChart]);

  useEffect(() => {
    if (!CHART_TYPES.includes(selectedChart)) {
      setSelectedChart('Cumulative Volume');
    }
  }, [selectedChart, setSelectedChart]);

  const dayToPeriodStart = useMemo(() => {
    const map = new Map<string, number>();
    dailyProgress.forEach(d => map.set(d.date, d.periodStartMs));
    return map;
  }, [dailyProgress]);

  // For Daily Volume: a day is "met" if it's the day that pushed cumulative over the goal
  // OR if the period was already met and this day continues strong performance
  // We'll mark days where cumulative >= goal, but prefer marking the threshold-crossing day
  const metDates = useMemo(() => {
    const set = new Set<string>();
    const periodMetDays = new Map<number, string>(); // periodStartMs -> date that crossed threshold
    
    // Find the first day in each period that crossed the goal
    dailyProgress.forEach((entry) => {
      if (entry.cumulativeValue >= entry.goalValue) {
        const existing = periodMetDays.get(entry.periodStartMs);
        if (!existing) {
          periodMetDays.set(entry.periodStartMs, entry.date);
        }
      }
    });
    
    // Mark threshold-crossing days and all subsequent days in met periods
    dailyProgress.forEach((entry) => {
      const thresholdDay = periodMetDays.get(entry.periodStartMs);
      if (thresholdDay && entry.date >= thresholdDay) {
        set.add(entry.date);
      }
    });
    
    return set;
  }, [dailyProgress]);

  const selectChart = (type: ChartType) => {
    setSelectedChart(type);
    trackStandardEvent('activity_history_chart_selected', { chartType: type });
  };

  const showTooltip = (title: string, body: string, date?: string) => {
    const periodStartMs = date ? dayToPeriodStart.get(date) : undefined;
    setTooltip({ title, body, periodStartMs });
  };

  const handleTooltipAction = () => {
    if (tooltip?.periodStartMs && onSelectPeriod) {
      onSelectPeriod(tooltip.periodStartMs);
      setTooltip(null);
      trackStandardEvent('activity_history_chart_tooltip_action', {
        action: 'view_period',
        chartType: selectedChart,
      });
    }
  };
  
  const handleBarPress = (periodStartMs?: number) => {
    if (periodStartMs && onSelectPeriod) {
      // Direct scroll sync - no modal needed
      onSelectPeriod(periodStartMs);
      trackStandardEvent('activity_history_chart_bar_tap', {
        chartType: selectedChart,
        periodStartMs,
      });
    }
  };

  const handleDaySelect = (date?: string) => {
    if (!date) return;
    const periodStart = dayToPeriodStart.get(date);
    if (periodStart) {
      handleBarPress(periodStart);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.surface, borderColor: theme.border.secondary }]}>
      <View style={[styles.header, { borderBottomColor: theme.border.primary }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {CHART_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onLayout={(event) => {
                tabLayouts.current[type] = event.nativeEvent.layout;
                // If this is the initially selected chart, scroll to it immediately
                if (type === selectedChart) {
                  scrollRef.current?.scrollTo({
                    x: event.nativeEvent.layout.x - 16,
                    animated: false,
                  });
                }
              }}
              style={[
                styles.tab,
                selectedChart === type && {
                  borderBottomColor: theme.tabBar.activeTint,
                  borderBottomWidth: 3,
                },
              ]}
              onPress={() => selectChart(type)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedChart === type ? theme.tabBar.activeTint : theme.text.secondary },
                  selectedChart === type && { fontWeight: '700' },
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.descriptionContainer}>
        <Text style={[styles.description, { color: theme.text.secondary }]}>
          {CHART_DESCRIPTIONS[selectedChart]}
        </Text>
        {selectedChart === 'Period Progress' && (
          <View style={styles.legendContainer}>
            <View style={[styles.legendIndicator, { backgroundColor: theme.status.met.barOverflow }]} />
            <Text style={[styles.legendText, { color: theme.text.secondary }]}>
              Overage
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chartArea}>
        {selectedChart === 'Period Progress' && (
          <PeriodProgressChart 
            data={periodProgress} 
            theme={theme} 
            onSelect={handleBarPress}
          />
        )}
        {selectedChart === 'Cumulative Volume' && (
          <CumulativeVolumeChart data={cumulativeVolume} theme={theme} unit={unit} onShowTooltip={showTooltip} />
        )}
        {/* Temporarily disabled charts */}
        {/*
        {selectedChart === 'Daily Volume' && (
          <DailyVolumeChart 
            data={dailyVolume} 
            metDates={metDates} 
            theme={theme} 
            unit={unit} 
            onShowTooltip={showTooltip}
            onSelectPeriodForDate={handleDaySelect}
          />
        )}
        {selectedChart === 'Daily Progress' && (
          <DailyProgressChart 
            data={dailyProgress} 
            theme={theme} 
            unit={unit} 
            onShowTooltip={showTooltip}
            onSelectPeriod={handleBarPress}
          />
        )}
        {selectedChart === 'Standards Progress' && (
          <StandardsProgressChart data={standardsProgress} theme={theme} onSelect={handleBarPress} />
        )}
        */}
      </View>

      {/* Chart Tooltip Modal for Daily Volume details (temporarily disabled with the chart) */}
      {/*
      {selectedChart === 'Daily Volume' && (
        <Modal
          visible={!!tooltip}
          transparent
          animationType="fade"
          onRequestClose={() => setTooltip(null)}
        >
          <TouchableWithoutFeedback onPress={() => setTooltip(null)}>
            <View style={[styles.modalOverlay, { backgroundColor: theme.background.overlay }]}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: theme.background.surface }]}>
                  <Text style={[styles.modalTitle, { color: theme.text.primary }]}>{tooltip?.title}</Text>
                  <Text style={[styles.modalDescription, { color: theme.text.secondary }]}>
                    {tooltip?.body}
                  </Text>
                  <View style={styles.modalFooter}>
                      {tooltip?.periodStartMs && (
                          <TouchableOpacity
                              style={[styles.modalActionButton, { backgroundColor: theme.background.chrome, borderColor: theme.primary.main }]}
                              onPress={handleTooltipAction}
                          >
                              <Text style={[styles.modalActionButtonText, { color: theme.primary.main }]}>View Period</Text>
                          </TouchableOpacity>
                      )}
                      <TouchableOpacity
                          style={[styles.modalCloseButton, { backgroundColor: theme.primary.main }]}
                          onPress={() => setTooltip(null)}
                      >
                          <Text style={styles.modalCloseButtonText}>Close</Text>
                      </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
      */}
    </View>
  );
}

const BAR_WIDTH = 30;
const CHART_HEIGHT = 150;
const LINE_CHART_LABEL_HEIGHT = 32;
const DEFAULT_POINT_SPACING = BAR_WIDTH + 8;
const MIN_COMPRESSED_POINT_SPACING = 14;
const CURRENT_VALUE_LABEL_MAX_WIDTH = 220;
const CURRENT_VALUE_LABEL_FALLBACK_WIDTH = 120;
const CURRENT_VALUE_LABEL_MIN_WIDTH = 80;
const MAX_VISIBLE_TICKS = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

type CumulativePoint = { label: string; value: number; date: string; timestamp: number };
type TimeScale = 'daily' | 'weekly' | 'monthly';

const determineTimeScale = (points: CumulativePoint[]): TimeScale => {
  const datedPoints = points.filter((point) => point.timestamp > 0);
  if (datedPoints.length < 2) {
    return 'daily';
  }

  const spanMs = datedPoints[datedPoints.length - 1].timestamp - datedPoints[0].timestamp;
  const spanDays = spanMs / DAY_MS;

  if (spanDays <= 30) return 'daily';
  if (spanDays <= 120) return 'weekly';
  return 'monthly';
};

const bucketCumulativeData = (points: CumulativePoint[], scale: TimeScale): CumulativePoint[] => {
  if (scale === 'daily' || points.length <= 2) {
    return points;
  }

  const hasOrigin = points[0]?.timestamp === 0;
  const originPoint = hasOrigin ? points[0] : undefined;
  const dataPoints = hasOrigin ? points.slice(1) : points;
  const buckets = new Map<string, CumulativePoint>();

  dataPoints.forEach((point) => {
    if (!point.timestamp) return;
    const dt = DateTime.fromMillis(point.timestamp);
    const start = scale === 'weekly' ? dt.startOf('week') : dt.startOf('month');
    const isoDate = start.toISODate();
    if (!isoDate) {
      return;
    }
    const bucketKey = isoDate;
    const existing = buckets.get(bucketKey);

    if (!existing || point.timestamp > existing.timestamp) {
      buckets.set(bucketKey, {
        ...point,
        label: start.toFormat(scale === 'weekly' ? 'MMM d' : 'MMM'),
        date: isoDate,
      });
    }
  });

  const bucketed = Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
  return originPoint ? [originPoint, ...bucketed] : bucketed;
};

const getTickIndices = (length: number, maxTicks: number = MAX_VISIBLE_TICKS): Set<number> => {
  const indices = new Set<number>();
  if (length === 0) return indices;

  const step = Math.max(1, Math.ceil(length / maxTicks));
  
  // Always include the last point (most recent date)
  indices.add(length - 1);

  // Add intermediate points, skipping those too close to the end
  // to avoid overlapping labels
  for (let i = 0; i < length - 1; i += step) {
    // If the tick is too close to the last point (within 75% of a step), skip it
    if ((length - 1) - i >= step * 0.75) {
      indices.add(i);
    }
  }
  
  return indices;
};

const formatAxisLabel = (point: CumulativePoint, scale: TimeScale): string => {
  if (!point.timestamp) return '';
  const dt = DateTime.fromMillis(point.timestamp);
  if (scale === 'daily') return dt.toFormat('MM/dd');
  if (scale === 'weekly') return dt.toFormat('MMM dd');
  return dt.toFormat('MMM');
};

function DailyVolumeChart({
  data,
  metDates,
  theme,
  unit,
  onShowTooltip,
  onSelectPeriodForDate,
}: {
  data: DailyVolumeData[];
  metDates: Set<string>;
  theme: any;
  unit: string;
  onShowTooltip: (title: string, body: string, date?: string) => void;
  onSelectPeriodForDate?: (date: string) => void;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeYear, setActiveYear] = useState<number | null>(data.length > 0 ? data[0].year : null);

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const viewportWidth = event.nativeEvent.layoutMeasurement.width;
    const centerX = scrollX + viewportWidth / 2;
    
    // Calculate which bar is at the center of the viewport
    const barWidth = BAR_WIDTH + 8; // BAR_WIDTH + marginHorizontal
    const centerIndex = Math.round(centerX / barWidth);
    const index = Math.max(0, Math.min(centerIndex, data.length - 1));
    
    if (data[index]) {
      setActiveYear(data[index].year);
    }
  };

  useEffect(() => {
    if (data.length > 0 && activeYear === null) {
      setActiveYear(data[0].year);
    }
  }, [data, activeYear]);

  return (
    <View>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.chartScroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.barContainer}>
          {data.map((item, index) => {
            const isMet = metDates.has(item.date);
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.barWrapper}
                onPress={() => {
                  onShowTooltip(`${item.label}`, `${item.value} ${unit}${isMet ? ' (Goal Met)' : ''}`, item.date);
                  onSelectPeriodForDate?.(item.date);
                }}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height: (item.value / maxVal) * CHART_HEIGHT,
                      backgroundColor: isMet ? theme.status.met.barComplete : theme.status.met.bar,
                    },
                  ]}
                />
                <Text style={[styles.label, { color: theme.text.tertiary }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      {activeYear !== null && (
        <View style={styles.yearIndicatorContainer}>
          <Text style={[styles.yearLabel, { color: theme.text.tertiary }]}>
            {activeYear}
          </Text>
        </View>
      )}
    </View>
  );
}

function DailyProgressChart({ 
  data, 
  theme, 
  unit, 
  onShowTooltip,
  onSelectPeriod,
}: { 
  data: DailyProgressData[]; 
  theme: any; 
  unit: string;
  onShowTooltip: (title: string, body: string, date?: string) => void;
  onSelectPeriod?: (periodStartMs: number) => void;
}) {
  // Group by period
  const periods: DailyProgressData[][] = [];
  let currentPeriod: DailyProgressData[] = [];
  
  data.forEach((d, i) => {
    if (i > 0 && d.periodStartMs !== data[i-1].periodStartMs) {
      periods.push(currentPeriod);
      currentPeriod = [];
    }
    currentPeriod.push(d);
  });
  if (currentPeriod.length > 0) periods.push(currentPeriod);

  const maxVal = Math.max(...data.map((d) => Math.max(d.cumulativeValue, d.goalValue)), 1);
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeYear, setActiveYear] = useState<number | null>(data.length > 0 ? data[0].year : null);

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const viewportWidth = event.nativeEvent.layoutMeasurement.width;
    const centerX = scrollX + viewportWidth / 2;
    
    // Calculate which bar is at the center of the viewport
    const barWidth = BAR_WIDTH + 8; // BAR_WIDTH + marginHorizontal
    const centerIndex = Math.round(centerX / barWidth);
    const index = Math.max(0, Math.min(centerIndex, data.length - 1));
    
    if (data[index]) {
      setActiveYear(data[index].year);
    }
  };

  useEffect(() => {
    if (data.length > 0 && activeYear === null) {
      setActiveYear(data[0].year);
    }
  }, [data, activeYear]);

  return (
    <View>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.chartScroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.barContainer}>
          {periods.map((period, pIdx) => (
            <View 
              key={pIdx} 
              style={[
                styles.periodGroup, 
                { 
                  backgroundColor: pIdx % 2 === 0 ? 'transparent' : theme.background.tertiary,
                  borderRightColor: theme.border.secondary,
                }
              ]}
            >
              {period.map((item, index) => {
                  const isMet = item.cumulativeValue >= item.goalValue;
                  const goalY = (item.goalValue / maxVal) * CHART_HEIGHT;
                  const remaining = Math.max(item.goalValue - item.cumulativeValue, 0);

                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.barWrapper}
                      onPress={() => {
                        onShowTooltip(
                          `${item.label}`, 
                          `Progress: ${item.cumulativeValue} / ${item.goalValue} ${unit}\n${isMet ? 'Goal Met!' : `${remaining} ${unit} remaining to goal`}`,
                          item.date
                        );
                        // Direct sync to period on tap
                        if (onSelectPeriod && item.periodStartMs) {
                          onSelectPeriod(item.periodStartMs);
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.bar,
                          {
                            height: (item.cumulativeValue / maxVal) * CHART_HEIGHT,
                            backgroundColor: isMet ? theme.status.met.barComplete : theme.status.met.bar,
                            opacity: 0.8,
                          },
                        ]}
                      />
                      {/* Goal line segment */}
                      <View style={[styles.goalLine, { bottom: goalY, backgroundColor: theme.text.tertiary, borderStyle: 'dashed', borderWidth: 1 }]} />
                      <Text style={[styles.label, { color: theme.text.tertiary }]} numberOfLines={1}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      {activeYear !== null && (
        <View style={styles.yearIndicatorContainer}>
          <Text style={[styles.yearLabel, { color: theme.text.tertiary }]}>
            {activeYear}
          </Text>
        </View>
      )}
    </View>
  );
}

const MAX_OVERFLOW_DISPLAY_RATIO = 0.25;
const MIN_BAR_HEIGHT = 4;

function PeriodProgressChart({ data, theme, onSelect }: { data: any[]; theme: any; onSelect?: (startMs: number) => void }) {
  const maxGoalValue = useMemo(() => {
    if (data.length === 0) return 1;
    const goals = data.map((d) => d.goal || 0);
    const maxGoal = Math.max(...goals);
    if (maxGoal > 0) return maxGoal;
    const fallbackActual = Math.max(...data.map((d) => d.actual || 0));
    return fallbackActual > 0 ? fallbackActual : 1;
  }, [data]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeYear, setActiveYear] = useState<number | null>(
    data.length > 0 && data[0].periodStartMs ? new Date(data[0].periodStartMs).getFullYear() : null
  );

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const viewportWidth = event.nativeEvent.layoutMeasurement.width;
    const centerX = scrollX + viewportWidth / 2;
    
    // Calculate which bar is at the center of the viewport
    const barWidth = BAR_WIDTH + 8; // BAR_WIDTH + marginHorizontal
    const centerIndex = Math.round(centerX / barWidth);
    const index = Math.max(0, Math.min(centerIndex, data.length - 1));
    
    if (data[index]?.periodStartMs) {
      setActiveYear(new Date(data[index].periodStartMs).getFullYear());
    }
  };

  useEffect(() => {
    if (data.length > 0 && data[0].periodStartMs && activeYear === null) {
      setActiveYear(new Date(data[0].periodStartMs).getFullYear());
    }
  }, [data, activeYear]);

  const unitHeight = CHART_HEIGHT / maxGoalValue;

  return (
    <View>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.chartScroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.barContainer}>
        {data.map((item, index) => {
          const goalValue = Math.max(item.goal || 0, 0);
          const actualValue = Math.max(item.actual || 0, 0);
          const isMet = goalValue > 0 ? actualValue >= goalValue : actualValue > 0;
          const isCurrent = item.status === 'In Progress';
          const hasOverflow = goalValue > 0 && actualValue > goalValue;

          const baseHeight = goalValue > 0 ? goalValue * unitHeight : 0;
          const actualHeight = actualValue * unitHeight;
          const maxOverflowHeight = CHART_HEIGHT * MAX_OVERFLOW_DISPLAY_RATIO;
          const overflowHeight = hasOverflow ? Math.min(actualHeight - baseHeight, maxOverflowHeight) : 0;
          const baseFillHeight = goalValue > 0 ? Math.min(actualHeight, baseHeight) : actualHeight;
          const columnHeight = Math.max(baseHeight, baseFillHeight + overflowHeight, MIN_BAR_HEIGHT);

          const fillColor = isMet ? theme.status.met.barComplete : theme.status.met.bar;
          const isDark = theme.background.surface !== '#fff';
          const trackBackground = isDark ? '#444444' : theme.border.primary;
          const trackBorderColor = isDark ? '#555555' : theme.border.primary;

          return (
              <TouchableOpacity 
                key={index} 
                style={[styles.barWrapper, isCurrent && styles.currentBarWrapper]}
                onPress={() => item.periodStartMs && onSelect?.(item.periodStartMs)}
              >
                <Text style={[styles.barValueLabel, { color: theme.text.tertiary, fontWeight: isCurrent ? '700' : '400' }]} numberOfLines={1}>
                  {formatTotal(actualValue)}
                </Text>
                <View
                  style={[
                    styles.stackedBar,
                    {
                      height: columnHeight,
                      backgroundColor: trackBackground,
                      borderColor: trackBorderColor,
                    },
                  ]}
                >
                  {/* Filled portion */}
                  {baseFillHeight > 0 && (
                    <View
                      style={[
                        styles.periodBarFill,
                        {
                          height: baseFillHeight,
                          backgroundColor: fillColor,
                          borderTopLeftRadius: overflowHeight > 0 ? 0 : 4,
                          borderTopRightRadius: overflowHeight > 0 ? 0 : 4,
                        },
                      ]}
                    />
                  )}
                  {/* Overflow portion rendered as a seamless extension */}
                  {overflowHeight > 0 && (
                    <View
                      style={[
                        styles.periodBarOverflow,
                        {
                          height: overflowHeight,
                          bottom: baseFillHeight,
                          backgroundColor: theme.status.met.barOverflow || theme.status.met.barComplete,
                        },
                      ]}
                    />
                  )}
                </View>
                <Text style={[styles.label, { color: theme.text.tertiary, fontWeight: isCurrent ? '700' : '400' }]} numberOfLines={1}>
                  {item.periodStartMs ? DateTime.fromMillis(item.periodStartMs).toFormat('MM/dd') : item.label}{isCurrent ? '*' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      {activeYear !== null && (
        <View style={styles.yearIndicatorContainer}>
          <Text style={[styles.yearLabel, { color: theme.text.tertiary }]}>
            {activeYear}
          </Text>
        </View>
      )}
    </View>
  );
}

function StandardsProgressChart({ data, theme, onSelect }: { data: any[]; theme: any; onSelect?: (startMs?: number) => void }) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    // Prepend a (0,0) point to show progress from origin
    return [{ value: 0, label: '', periodStartMs: undefined }, ...data];
  }, [data]);

  const maxVal = Math.max(...chartData.map((d) => d.value), 1);
  const CHART_CONTENT_HEIGHT = CHART_HEIGHT - 20;
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeYear, setActiveYear] = useState<number | null>(
    chartData.length > 0 && chartData[chartData.length - 1].periodStartMs 
      ? new Date(chartData[chartData.length - 1].periodStartMs).getFullYear() 
      : null
  );

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const viewportWidth = event.nativeEvent.layoutMeasurement.width;
    const centerX = scrollX + viewportWidth / 2;
    
    // Calculate which bar is at the center of the viewport
    const barWidth = BAR_WIDTH + 8; // BAR_WIDTH + marginHorizontal
    const centerIndex = Math.round(centerX / barWidth);
    const index = Math.max(0, Math.min(centerIndex, chartData.length - 1));
    
    if (chartData[index]?.periodStartMs) {
      setActiveYear(new Date(chartData[index].periodStartMs).getFullYear());
    }
  };

  useEffect(() => {
    const lastItem = chartData[chartData.length - 1];
    if (lastItem?.periodStartMs && activeYear === null) {
      setActiveYear(new Date(lastItem.periodStartMs).getFullYear());
    }
  }, [chartData, activeYear]);

  return (
    <View>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.chartScroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.lineChartContainer]}>
          <View style={[styles.lineChartAxis, { backgroundColor: theme.border.secondary }]} pointerEvents="none" />
          <View style={[styles.lineChartYAxis, { backgroundColor: theme.border.secondary }]} pointerEvents="none" />
          {chartData.map((item, index) => {
            const y = (item.value / maxVal) * CHART_CONTENT_HEIGHT;
            const prevY = index > 0 ? (chartData[index - 1].value / maxVal) * CHART_CONTENT_HEIGHT : y;
            
            const dx = BAR_WIDTH + 8;
            const dy = y - prevY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.barWrapper}
                onPress={() => item.periodStartMs && onSelect?.(item.periodStartMs)}
                activeOpacity={0.8}
              >
                <View style={styles.lineChartPointArea}>
                  {index > 0 && (
                    <View 
                      style={[
                        styles.lineSegment,
                        {
                          width: length,
                          left: (BAR_WIDTH / 2) - (dx / 2) - (length / 2),
                          bottom: ((y + prevY) / 2) - 1,
                          transform: [{ rotate: `${-angle}rad` }],
                          backgroundColor: theme.status.met.bar,
                        },
                      ]}
                    />
                  )}

                  {item.periodStartMs && (
                    <View style={[styles.dot, { bottom: y - 4, backgroundColor: theme.status.met.bar, zIndex: 1 }]} />
                  )}
                </View>
                
                {item.periodStartMs ? (
                  <Text style={[styles.lineChartLabel, { color: theme.text.tertiary }]} numberOfLines={1}>
                    {DateTime.fromMillis(item.periodStartMs).toFormat('MM/dd')}
                  </Text>
                ) : (
                  <View style={styles.lineChartLabelSpacer} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      {activeYear !== null && (
        <View style={styles.yearIndicatorContainer}>
          <Text style={[styles.yearLabel, { color: theme.text.tertiary }]}>
            {activeYear}
          </Text>
        </View>
      )}
    </View>
  );
}

function CumulativeVolumeChart({ 
  data, 
  theme, 
  unit,
  onShowTooltip,
}: { 
  data: CumulativePoint[]; 
  theme: any; 
  unit: string;
  onShowTooltip: (title: string, body: string, date?: string) => void;
}) {
  const chartData = useMemo<CumulativePoint[]>(() => {
    if (data.length === 0) return [];
    // Prepend a (0,0) point to show progress from origin
    return [{ value: 0, label: '', date: '', timestamp: 0 }, ...data];
  }, [data]);

  const [chartWidth, setChartWidth] = useState(0);

  const { scaledData, timeScale } = useMemo(() => {
    const scale = determineTimeScale(chartData);
    return {
      scaledData: bucketCumulativeData(chartData, scale),
      timeScale: scale,
    };
  }, [chartData]);

  const effectiveData = scaledData.length > 0 ? scaledData : chartData;
  const tickIndices = useMemo(() => getTickIndices(effectiveData.length), [effectiveData.length, timeScale]);

  const maxVal = Math.max(...effectiveData.map((d) => d.value), 1);
  const CHART_CONTENT_HEIGHT = CHART_HEIGHT - 20;
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeYear, setActiveYear] = useState<number | null>(
    effectiveData.length > 0 && effectiveData[effectiveData.length - 1].timestamp 
      ? new Date(effectiveData[effectiveData.length - 1].timestamp).getFullYear() 
      : null
  );
  const [currentValueLabelWidth, setCurrentValueLabelWidth] = useState(CURRENT_VALUE_LABEL_FALLBACK_WIDTH);

  const handleChartLayout = useCallback(
    (event: any) => {
      const width = event.nativeEvent.layout.width;
      if (Math.abs(width - chartWidth) > 1) {
        setChartWidth(width);
      }
    },
    [chartWidth]
  );

  const handleCurrentValueLabelLayout = useCallback(
    (event: any) => {
      const measuredWidth = Math.max(
        CURRENT_VALUE_LABEL_MIN_WIDTH,
        Math.min(event.nativeEvent.layout.width, CURRENT_VALUE_LABEL_MAX_WIDTH)
      );
      if (Math.abs(measuredWidth - currentValueLabelWidth) > 1) {
        setCurrentValueLabelWidth(measuredWidth);
      }
    },
    [currentValueLabelWidth]
  );

  const wantsCompressedView = true;
  const canCompress = wantsCompressedView && chartWidth > 0 && effectiveData.length > 1;

  // Use minimal padding for the chart area itself
  const chartPaddingLeft = 8;
  
  // The trailing label can extend past the chart area.
  // We only need to ensure the dot/line itself doesn't get clipped.
  // The ScrollView clip settings will determine if the label shows.
  // But since we want to prevent horizontal scroll in compressed mode, 
  // we must ensure the label fits if we want it visible.
  // However, forcing the whole chart to compress just for one label makes it too narrow.
  // Let's compromise: reserve less space, allow label to potentially be cut off 
  // or use the parent padding (which is 16px) to help absorb it.
  
  const trailingIndicatorPadding = 8; 

  const slotWidth = canCompress
    ? Math.max(
        (chartWidth - chartPaddingLeft - trailingIndicatorPadding) / Math.max(effectiveData.length - 1, 1),
        MIN_COMPRESSED_POINT_SPACING
      )
    : DEFAULT_POINT_SPACING;

  const gap = canCompress ? Math.max(slotWidth * 0.1, 2) : 4;
  const wrapperWidth = Math.max(slotWidth - gap * 2, 8);
  const labelWidth = Math.max(slotWidth, wrapperWidth + gap * 2);

  const isCompressed = canCompress;
  const slotSpacing = slotWidth;

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const viewportWidth = event.nativeEvent.layoutMeasurement.width;
    const centerX = scrollX + viewportWidth / 2;
    
    // Calculate which bar is at the center of the viewport
    const barWidth = slotSpacing; // dynamic slot width
    const centerIndex = Math.round(centerX / barWidth);
    const index = Math.max(0, Math.min(centerIndex, effectiveData.length - 1));
    
    if (effectiveData[index]?.timestamp) {
      setActiveYear(new Date(effectiveData[index].timestamp).getFullYear());
    }
  };

  useEffect(() => {
    const lastItem = effectiveData[effectiveData.length - 1];
    if (lastItem?.timestamp && activeYear === null) {
      setActiveYear(new Date(lastItem.timestamp).getFullYear());
    }
  }, [effectiveData, activeYear]);

  const latestIndex = effectiveData.length - 1;

  const pointPositions = useMemo(() => {
    if (effectiveData.length === 0) return [];

    const points: { x: number; svgY: number; valueHeight: number }[] = [];
    let currentX = 0;

    effectiveData.forEach((item, index) => {
      const valueHeight = (item.value / maxVal) * CHART_CONTENT_HEIGHT;
      const svgY = CHART_CONTENT_HEIGHT - valueHeight;
      const isOriginPoint = index === 0 && item.timestamp === 0;
      const xPos = currentX + wrapperWidth / 2 + gap;
      const adjustedX = isOriginPoint ? xPos - wrapperWidth / 2 : xPos;

      points.push({
        x: adjustedX,
        svgY,
        valueHeight,
      });

      if (index < effectiveData.length - 1) {
        currentX += slotSpacing;
      }
    });

    return points;
  }, [effectiveData, maxVal, CHART_CONTENT_HEIGHT, slotSpacing, wrapperWidth, gap]);

  const chartContentWidth =
    pointPositions.length > 1 ? (effectiveData.length - 1) * slotSpacing + wrapperWidth : wrapperWidth;
  
  // Calculate total required width including padding
  const totalRequiredWidth = chartPaddingLeft + chartContentWidth + trailingIndicatorPadding;
  const shouldAllowScroll = !isCompressed || totalRequiredWidth > chartWidth;

  const areaPath = useMemo(() => {
    if (pointPositions.length < 2) return '';

    const firstX = pointPositions[0].x;
    const lastX = pointPositions[pointPositions.length - 1].x;
    const bottomY = CHART_CONTENT_HEIGHT;

    let path = `M ${firstX} ${bottomY} `;
    pointPositions.forEach((point) => {
      path += `L ${point.x} ${point.svgY} `;
    });
    path += `L ${lastX} ${bottomY} Z`;

    return path;
  }, [pointPositions, CHART_CONTENT_HEIGHT]);

  const linePath = useMemo(() => {
    if (pointPositions.length < 2) return '';

    return pointPositions
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.svgY}`)
      .join(' ');
  }, [pointPositions]);

  const gradientStartColor = theme.status.met.bar;
  const gradientId = useId();

  return (
    <View onLayout={handleChartLayout}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        scrollEnabled={shouldAllowScroll}
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={[
          styles.chartScroll,
          { 
            paddingLeft: chartPaddingLeft,
            paddingRight: trailingIndicatorPadding 
          },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        overflow="visible" // Allow labels to overflow the scroll view bounds if needed
      >
        <View
          style={[
            styles.lineChartContainer,
          ]}
        >
          {/* SVG-rendered line and gradient */}
          {pointPositions.length > 1 && (
            <Svg
              style={[
                styles.chartSvg,
                {
                  height: CHART_CONTENT_HEIGHT,
                  width: chartContentWidth,
                },
              ]}
              viewBox={`0 0 ${chartContentWidth} ${CHART_CONTENT_HEIGHT}`}
              pointerEvents="none"
            >
              <Defs>
                <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={gradientStartColor} stopOpacity="0.25" />
                  <Stop offset="50%" stopColor={gradientStartColor} stopOpacity="0.15" />
                  <Stop offset="100%" stopColor={gradientStartColor} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              {areaPath ? <Path d={areaPath} fill={`url(#${gradientId})`} /> : null}
              {linePath ? (
                <Path d={linePath} stroke={gradientStartColor} strokeWidth={2} strokeLinecap="round" fill="none" />
              ) : null}
            </Svg>
          )}
          
          <View style={[styles.lineChartAxis, { backgroundColor: theme.border.secondary }]} pointerEvents="none" />
          <View style={[styles.lineChartYAxis, { backgroundColor: theme.border.secondary }]} pointerEvents="none" />
          {effectiveData.map((item, index) => {
            const pointPosition = pointPositions[index];
            const y = pointPosition?.valueHeight ?? 0;
            const isLatest = index === latestIndex && item.timestamp > 0;
            const indicatorValue = formatTotal(item.value);
            const indicatorY = Math.min(Math.max(y, 0), CHART_CONTENT_HEIGHT);
            const showLabel = tickIndices.has(index) && item.timestamp > 0;
            const isOriginPoint = index === 0 && item.timestamp === 0;
            const wrapperStyle = [
              styles.barWrapper,
              {
                width: wrapperWidth,
                marginLeft: gap,
                marginRight: gap,
              },
              // Pull the synthetic origin point onto the Y-axis so the line starts at the true origin
              isOriginPoint && { marginLeft: -wrapperWidth / 2 },
            ];
            
            return (
              <TouchableOpacity 
                key={index} 
                style={wrapperStyle}
                onPress={() => {
                  if (item.date) {
                    onShowTooltip(
                      item.label || DateTime.fromMillis(item.timestamp).toFormat('MM/dd'),
                      `${item.value} ${unit}`,
                      item.date
                    );
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.lineChartPointArea}>
                  {isLatest && (
                    <>
                      <View
                        style={[
                          styles.currentValueMarker,
                          {
                            bottom: indicatorY - 4,
                            backgroundColor: theme.status.met.bar,
                            borderColor: theme.background.surface,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.currentValueLabel,
                          {
                            bottom: Math.min(indicatorY + 8, CHART_CONTENT_HEIGHT - 4),
                            backgroundColor: theme.background.surface,
                            color: theme.text.primary,
                            borderColor: theme.border.secondary,
                            left: wrapperWidth / 2,
                            transform: [{ translateX: -currentValueLabelWidth / 2 }],
                          },
                        ]}
                        numberOfLines={1}
                        onLayout={handleCurrentValueLabelLayout}
                      >
                        {indicatorValue}
                      </Text>
                    </>
                  )}
                </View>
                
                {showLabel ? (
                  <Text
                    style={[
                      styles.lineChartLabel,
                      { color: theme.text.tertiary, width: 45 },
                    ]}
                    numberOfLines={1}
                  >
                    {formatAxisLabel(item, timeScale)}
                  </Text>
                ) : (
                  <View style={[styles.lineChartLabelSpacer, { width: labelWidth }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      {activeYear !== null && (
        <View style={styles.yearIndicatorContainer}>
          <Text style={[styles.yearLabel, { color: theme.text.tertiary }]}>
            {activeYear}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  header: {
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  tabsContainer: {
    paddingRight: 16,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chartArea: {
    height: CHART_HEIGHT + 80,
    justifyContent: 'center',
  },
  chartScroll: {
    paddingBottom: 10,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 60,
    overflow: 'visible',
  },
  lineChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + LINE_CHART_LABEL_HEIGHT,
    position: 'relative',
    overflow: 'visible',
  },
  chartSvg: {
    position: 'absolute',
    left: 0,
    bottom: LINE_CHART_LABEL_HEIGHT,
    zIndex: 0,
  },
  lineChartAxis: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: LINE_CHART_LABEL_HEIGHT,
    height: 1,
    opacity: 0.5,
  },
  lineChartYAxis: {
    position: 'absolute',
    left: 0,
    bottom: LINE_CHART_LABEL_HEIGHT,
    width: 1,
    height: CHART_HEIGHT - 20,
    opacity: 0.25,
  },
  lineChartPointArea: {
    height: CHART_HEIGHT - 20,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1,
  },
  lineChartLabel: {
    fontSize: 9,
    marginTop: 8,
    textAlign: 'center',
    width: BAR_WIDTH + 8,
    minHeight: LINE_CHART_LABEL_HEIGHT - 8,
  },
  lineChartLabelSpacer: {
    width: BAR_WIDTH + 8,
    height: LINE_CHART_LABEL_HEIGHT,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    zIndex: 1,
  },
  periodGroup: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginRight: 4,
      borderRightWidth: 1,
      paddingRight: 4,
      paddingLeft: 4,
      borderRadius: 4,
  },
  barWrapper: {
    width: BAR_WIDTH,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  currentBarWrapper: {
    // maybe some extra padding or margin?
  },
  bar: {
    width: '80%',
    borderRadius: 4,
  },
  stackedBar: {
    width: '80%',
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
    borderWidth: 1,
  },
  periodBarFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  periodBarOverflow: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  goalLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      zIndex: 1,
  },
  label: {
    fontSize: 9,
    marginTop: 8,
    textAlign: 'center',
    width: BAR_WIDTH + 8,
  },
  barValueLabel: {
    fontSize: 9,
    textAlign: 'center',
    width: BAR_WIDTH + 8,
    marginBottom: 4,
  },
  yearIndicatorContainer: {
    alignItems: 'center',
    marginTop: 4,
    height: 16,
    justifyContent: 'center',
  },
  yearLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
    paddingRight: 8,
  },
  description: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
  },
  dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      position: 'absolute',
  },
  currentValueMarker: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1,
      zIndex: 2,
  },
  currentValueLabel: {
      position: 'absolute',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      fontSize: 10,
      borderWidth: 1,
      zIndex: 2,
      maxWidth: CURRENT_VALUE_LABEL_MAX_WIDTH,
      minWidth: CURRENT_VALUE_LABEL_MIN_WIDTH,
      textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalCloseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 12,
  },
  modalActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
  },
  modalActionButtonText: {
    fontWeight: '600',
  },
});
