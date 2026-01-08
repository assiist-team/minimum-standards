import React, { useMemo, useState, useRef, useEffect } from 'react';
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
import { useTheme } from '../theme/useTheme';
import { DailyVolumeData, DailyProgressData } from '../utils/activityCharts';
import { useUIPreferencesStore, ChartType } from '../stores/uiPreferencesStore';
import { trackStandardEvent } from '../utils/analytics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CHART_TYPES: ChartType[] = [
  'Daily Volume',
  'Daily Progress',
  'Period Progress',
  'Standards Progress',
];

const CHART_DESCRIPTIONS: Record<ChartType, string> = {
  'Daily Volume': 'Daily activity totals showing your day-to-day pace and consistency.',
  'Daily Progress': 'Cumulative progress through each period toward your minimum standard.',
  'Period Progress': 'Comparison of total volume vs. goal across historical periods.',
  'Standards Progress': 'Your minimum standards over time.',
};

export interface ActivityVolumeChartsProps {
  dailyVolume: DailyVolumeData[];
  dailyProgress: DailyProgressData[];
  periodProgress: { label: string; actual: number; goal: number; status: string; periodStartMs?: number }[];
  standardsProgress: { label: string; value: number; periodStartMs?: number }[];
  unit: string;
  onSelectPeriod?: (periodStartMs: number) => void;
}

export function ActivityVolumeCharts({
  dailyVolume,
  dailyProgress,
  periodProgress,
  standardsProgress,
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
      <Text style={[styles.description, { color: theme.text.secondary }]}>
        {CHART_DESCRIPTIONS[selectedChart]}
      </Text>

      <View style={styles.chartArea}>
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
        {selectedChart === 'Period Progress' && (
          <PeriodProgressChart 
            data={periodProgress} 
            theme={theme} 
            onSelect={handleBarPress}
          />
        )}
        {selectedChart === 'Standards Progress' && (
          <StandardsProgressChart data={standardsProgress} theme={theme} onSelect={handleBarPress} />
        )}
      </View>

      {/* Chart Tooltip Modal for Daily Volume details */}
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
    </View>
  );
}

const BAR_WIDTH = 30;
const CHART_HEIGHT = 150;

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

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
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
                    backgroundColor: isMet ? theme.status.met.bar : theme.primary.main,
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

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
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
                          backgroundColor: isMet ? theme.status.met.bar : theme.primary.main,
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
  );
}

function PeriodProgressChart({ data, theme, onSelect }: { data: any[]; theme: any; onSelect?: (startMs: number) => void }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.actual, d.goal)), 1);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
      <View style={styles.barContainer}>
        {data.map((item, index) => {
          const isMet = item.actual >= item.goal;
          const isCurrent = item.status === 'In Progress';
          return (
            <TouchableOpacity 
              key={index} 
              style={[styles.barWrapper, isCurrent && styles.currentBarWrapper]}
              onPress={() => item.periodStartMs && onSelect?.(item.periodStartMs)}
            >
              {isCurrent && <View style={[styles.currentGlow, { backgroundColor: theme.primary.main }]} />}
              <View style={[styles.goalBar, { height: (item.goal / maxVal) * CHART_HEIGHT, backgroundColor: theme.border.primary }]}>
                  <View
                    style={[
                        styles.actualBar,
                        {
                            height: ((Math.min(item.actual, item.goal) / item.goal) * 100 + '%') as any,
                            backgroundColor: isMet ? theme.status.met.bar : theme.primary.main,
                        },
                    ]}
                  />
                  {item.actual > item.goal && (
                      <View 
                        style={[
                            styles.overflowBar,
                            {
                                height: (((item.actual - item.goal) / item.goal) * 100 + '%') as any,
                                backgroundColor: theme.status.met.bar,
                                bottom: '100%',
                            }
                        ]}
                      />
                  )}
              </View>
              <Text style={[styles.label, { color: theme.text.tertiary, fontWeight: isCurrent ? '700' : '400' }]} numberOfLines={1}>
                {item.label}{isCurrent ? '*' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function StandardsProgressChart({ data, theme, onSelect }: { data: any[]; theme: any; onSelect?: (startMs?: number) => void }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
      <View style={[styles.barContainer, { alignItems: 'flex-end', paddingBottom: 20 }]}>
        {data.map((item, index) => {
          const y = (item.value / maxVal) * (CHART_HEIGHT - 20);
          const prevY = index > 0 ? (data[index - 1].value / maxVal) * (CHART_HEIGHT - 20) : y;
          
          return (
            <TouchableOpacity 
              key={index} 
              style={styles.barWrapper}
              onPress={() => onSelect?.(item.periodStartMs)}
              activeOpacity={0.8}
            >
              {/* Horizontal line from previous dot to current X position */}
              {index > 0 && (
                <View 
                  style={[
                    styles.horizontalConnector, 
                    { 
                      bottom: prevY,
                      backgroundColor: theme.primary.main,
                      width: BAR_WIDTH + 8,
                      left: - (BAR_WIDTH + 8) / 2,
                    }
                  ]} 
                />
              )}
              
              {/* Vertical connector if value changed */}
              {index > 0 && item.value !== data[index - 1].value && (
                <View 
                  style={[
                    styles.connector, 
                    { 
                      bottom: Math.min(y, prevY),
                      height: Math.abs(y - prevY),
                      backgroundColor: theme.primary.main,
                      left: -4,
                    }
                  ]} 
                />
              )}

              <View style={[styles.dot, { bottom: y, backgroundColor: theme.primary.main }]} />
              
              <Text style={[styles.label, { color: theme.text.tertiary }]} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
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
    marginBottom: 12,
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
    height: CHART_HEIGHT + 40,
    justifyContent: 'center',
  },
  chartScroll: {
    paddingBottom: 10,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 20,
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
  currentGlow: {
    position: 'absolute',
    top: -10,
    bottom: 20,
    left: 0,
    right: 0,
    borderRadius: 4,
    opacity: 0.1,
  },
  bar: {
    width: '80%',
    borderRadius: 4,
  },
  goalBar: {
      width: '80%',
      backgroundColor: '#eee',
      borderRadius: 4,
      justifyContent: 'flex-end',
      overflow: 'visible',
  },
  actualBar: {
      width: '100%',
      borderRadius: 4,
  },
  overflowBar: {
      width: '100%',
      position: 'absolute',
      borderRadius: 4,
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
  description: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      position: 'absolute',
  },
  connector: {
      position: 'absolute',
      width: 1,
      left: -BAR_WIDTH / 2,
  },
  horizontalConnector: {
    position: 'absolute',
    height: 1,
    zIndex: 0,
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
