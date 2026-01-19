import { NavigatorScreenParams } from '@react-navigation/native';

export const SETTINGS_TAB_ROUTE_NAME = 'SettingsTab' as const;
export const SETTINGS_STACK_ROOT_SCREEN_NAME = 'SettingsRoot' as const;

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  PasswordReset: undefined;
};

// Individual tab stack param lists
export type DashboardStackParamList = {
  ActiveStandardsDashboard: undefined;
  StandardsBuilder: { standardId?: string };
  StandardDetail: { standardId: string };
};

export type StandardsStackParamList = {
  StandardsLibrary: undefined;
  StandardsBuilder: { standardId?: string };
  StandardDetail: { standardId: string };
};

export type ActivitiesStackParamList = {
  Scorecard: { activityId?: string } | undefined;
};

export type SettingsStackParamList = {
  SettingsRoot: undefined;
};

// Bottom tab navigator param list
export type BottomTabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Standards: NavigatorScreenParams<StandardsStackParamList>;
  Activities: NavigatorScreenParams<ActivitiesStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

// Main stack now contains the bottom tab navigator
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  StandardPeriodActivityLogs: {
    standardId: string;
    periodStartMs?: number;
    periodEndMs?: number;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
