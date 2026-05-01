import AssetsPath from '@Constants/AssetsPath';

export const getIconSourceForBottomTabs = (routeName: string, isFocus: boolean) => {
  switch (routeName) {
    case 'Home':
      return isFocus ? AssetsPath.ic_fillHome : AssetsPath.ic_home;
    case 'Alarm':
      return isFocus ? AssetsPath.ic_fillAlarm : AssetsPath.ic_unFillAlarm;
    case 'History':
      return AssetsPath.ic_unFillHistory;
    case 'Setting':
      return AssetsPath.ic_unFillSetting;
    default:
      return null;
  }
};
