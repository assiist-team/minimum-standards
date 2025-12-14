import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  PasswordReset: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  ActivityLibrary: undefined;
  StandardsBuilder: undefined;
  StandardsLibrary: undefined;
  ArchivedStandards: undefined;
  ActiveStandardsDashboard: undefined;
  StandardDetail: { standardId: string };
  Settings: undefined;
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
