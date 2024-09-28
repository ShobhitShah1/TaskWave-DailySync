import AssetsPath from "../Global/AssetsPath";

export const getIconSourceForBottomTabs = (routeName: string) => {
  switch (routeName) {
    case "Home":
      return AssetsPath.ic_fillHome;
    case "Notification":
      return AssetsPath.ic_unFillNotification;
    case "History":
      return AssetsPath.ic_unFillHistory;
    case "Setting":
      return AssetsPath.ic_unFillSetting;
    default:
      return null;
  }
};
