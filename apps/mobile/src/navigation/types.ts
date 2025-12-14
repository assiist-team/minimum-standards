import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  PasswordReset: undefined;
};

// Individual tab stack param lists
export type DashboardStackParamList = {
  ActiveStandardsDashboard: undefined;
  StandardDetail: { standardId: string };
};

export type StandardsStackParamList = {
  StandardsLibrary: undefined;
  StandardsBuilder: { standardId?: string };
  StandardDetail: { standardId: string };
};

export type ActivitiesStackParamList = {
  ActivityLibrary: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

// Bottom tab navigator param list
export type BottomTabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Standards: NavigatorScreenParams<StandardsStackParamList>;
  Activities: NavigatorScreenParams<ActivitiesStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

// Main stack now contains the bottom tab navigator
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
