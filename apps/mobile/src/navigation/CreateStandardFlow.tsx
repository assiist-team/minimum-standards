import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreateStandardFlowParamList, MainStackParamList } from './types';
import { SelectActivityStep } from '../screens/create-standard/SelectActivityStep';
import { useTheme } from '../theme/useTheme';
import { useStandardsBuilderStore } from '../stores/standardsBuilderStore';

const Stack = createNativeStackNavigator<CreateStandardFlowParamList>();

// --- StepIndicator ---

function StepIndicator({ current, total }: { current: number; total: number }) {
  const theme = useTheme();
  return (
    <View style={stepIndicatorStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            stepIndicatorStyles.dot,
            i < current
              ? { backgroundColor: theme.button.primary.background }
              : i === current
                ? { backgroundColor: theme.button.primary.background, opacity: 0.6 }
                : { backgroundColor: theme.border.primary },
          ]}
        />
      ))}
    </View>
  );
}

const stepIndicatorStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

// --- StepHeader ---

interface StepHeaderProps {
  step: number;
  totalSteps: number;
  title: string;
  onBack?: () => void;
  onClose: () => void;
}

export function StepHeader({ step, totalSteps, title, onBack, onClose }: StepHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[headerStyles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={[headerStyles.row, { borderBottomColor: theme.border.primary }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={headerStyles.iconButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={headerStyles.iconButton} />
        )}
        <Text style={[headerStyles.title, { color: theme.text.primary }]}>{title}</Text>
        <TouchableOpacity onPress={onClose} style={headerStyles.iconButton}>
          <MaterialIcons name="close" size={24} color={theme.text.secondary} />
        </TouchableOpacity>
      </View>
      <StepIndicator current={step} total={totalSteps} />
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// --- Placeholder screens for Steps 2 & 3 (WP05 will implement these) ---

function SetVolumeStepPlaceholder() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<CreateStandardFlowParamList>>();
  const mainNavigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background.chrome }}>
      <StepHeader
        step={1}
        totalSteps={3}
        title="Set Volume"
        onBack={() => navigation.goBack()}
        onClose={() => mainNavigation.goBack()}
      />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.text.secondary }}>Step 2 — Coming in WP05</Text>
      </View>
    </View>
  );
}

function SetPeriodStepPlaceholder() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<CreateStandardFlowParamList>>();
  const mainNavigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background.chrome }}>
      <StepHeader
        step={2}
        totalSteps={3}
        title="Set Period"
        onBack={() => navigation.goBack()}
        onClose={() => mainNavigation.goBack()}
      />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.text.secondary }}>Step 3 — Coming in WP05</Text>
      </View>
    </View>
  );
}

// --- CreateStandardFlow Navigator ---

export function CreateStandardFlow() {
  const reset = useStandardsBuilderStore((s) => s.reset);

  // Reset the builder store when the flow mounts
  React.useEffect(() => {
    reset();
  }, [reset]);

  return (
    <Stack.Navigator
      initialRouteName="SelectActivity"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SelectActivity" component={SelectActivityStep} />
      <Stack.Screen name="SetVolume" component={SetVolumeStepPlaceholder} />
      <Stack.Screen name="SetPeriod" component={SetPeriodStepPlaceholder} />
    </Stack.Navigator>
  );
}
