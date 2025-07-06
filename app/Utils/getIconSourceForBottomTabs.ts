import AssetsPath from '../Constants/AssetsPath';

export const getIconSourceForBottomTabs = (routeName: string, isFocus: boolean) => {
  switch (routeName) {
    case 'Home':
      return isFocus ? AssetsPath.ic_fillHome : AssetsPath.ic_home;
    case 'Coming Soon':
      return AssetsPath.ic_unFillComingSoon;
    case 'History':
      return AssetsPath.ic_unFillHistory;
    case 'Setting':
      return AssetsPath.ic_unFillSetting;
    default:
      return null;
  }
};
