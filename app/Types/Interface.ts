declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  BottomTab:
    | {
        screen?:
          | "Home"
          | "Notification"
          | "AddReminder"
          | "History"
          | "Setting";
      }
    | undefined;
  Home: undefined;
  Notification: undefined;
  AddReminder: undefined;
  History: undefined;
  Setting: undefined;
};
