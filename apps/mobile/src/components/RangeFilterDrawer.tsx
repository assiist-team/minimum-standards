import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

export type TimeRange = '7d' | '30d' | '90d' | 'All';

interface RangeFilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  selectedRange: TimeRange;
  onSelectRange: (range: TimeRange) => void;
}

const RANGES: { label: string; value: TimeRange; description: string }[] = [
  { label: 'Last 7 Days', value: '7d', description: 'Quick check of this week\'s momentum.' },
  { label: 'Last 30 Days', value: '30d', description: 'Standard monthly overview of consistency.' },
  { label: 'Last 90 Days', value: '90d', description: 'Long-term trend across multiple months.' },
  { label: 'All History', value: 'All', description: 'Complete record of every period logged.' },
];

export function RangeFilterDrawer({
  visible,
  onClose,
  selectedRange,
  onSelectRange,
}: RangeFilterDrawerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const slideAnim = React.useRef(new Animated.Value(windowHeight)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: windowHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, windowHeight]);

  const handleSelect = (range: TimeRange) => {
    onSelectRange(range);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.background.overlay }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.drawer,
                {
                  backgroundColor: theme.background.chrome,
                  paddingBottom: Math.max(insets.bottom, 24),
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.header}>
                <View style={[styles.handle, { backgroundColor: theme.border.secondary }]} />
                <Text style={[styles.title, { color: theme.text.primary }]}>Select Time Range</Text>
              </View>

              <View style={styles.content}>
                {RANGES.map((range) => {
                  const isSelected = selectedRange === range.value;
                  return (
                    <TouchableOpacity
                      key={range.value}
                      style={[
                        styles.rangeItem,
                        isSelected && { backgroundColor: theme.background.surface, borderColor: theme.primary.main },
                        !isSelected && { borderColor: 'transparent' }
                      ]}
                      onPress={() => handleSelect(range.value)}
                    >
                      <View style={styles.rangeTextContainer}>
                        <Text style={[styles.rangeLabel, { color: theme.text.primary }, isSelected && { color: theme.primary.main, fontWeight: '700' }]}>
                          {range.label}
                        </Text>
                        <Text style={[styles.rangeDescription, { color: theme.text.secondary }]}>
                          {range.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <MaterialIcon name="check-circle" size={24} color={theme.primary.main} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.background.surface }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    gap: 12,
    marginBottom: 24,
  },
  rangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  rangeTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  rangeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rangeDescription: {
    fontSize: 13,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
