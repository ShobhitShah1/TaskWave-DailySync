import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { memo, useCallback } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import CustomSwitch from '../../../Components/CustomSwitch';
import AssetsPath from '../../../Constants/AssetsPath';
import TextString from '../../../Constants/TextString';
import { FONTS, SIZE } from '../../../Constants/Theme';
import { useAppContext } from '../../../Contexts/ThemeProvider';
import useThemeColors from '../../../Hooks/useThemeMode';

type LeftIconType = 'grid' | 'back' | 'none';

interface IHomeHeaderProps {
  title?: string;
  leftIconType?: LeftIconType;
  titleAlignment?: 'left' | 'center';
  showThemeSwitch?: boolean;
  onBackPress?: () => void;
  onServicePress?: () => void;
}

const HomeHeader = ({
  title,
  leftIconType = 'grid',
  titleAlignment = 'left',
  showThemeSwitch = true,
  onBackPress,
  onServicePress,
}: IHomeHeaderProps) => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { theme, toggleTheme, viewMode, toggleViewMode } = useAppContext();

  const handleToggle = useCallback(
    (state: boolean) => {
      toggleTheme(state ? 'light' : 'dark');
    },
    [toggleTheme],
  );

  const renderLeftIcon = () => {
    if (leftIconType === 'none') return null;

    const icon = leftIconType === 'grid' ? AssetsPath.ic_menu : AssetsPath.ic_leftArrow;
    const onPress =
      leftIconType === 'grid'
        ? () => toggleViewMode(viewMode === 'grid' ? 'list' : 'grid')
        : () => onBackPress?.() || navigation.goBack();

    return (
      <Pressable hitSlop={10} style={styles.iconButton} onPress={onPress}>
        <Image
          source={icon}
          style={styles.icon}
          tintColor={leftIconType === 'back' ? colors.text : undefined}
        />
      </Pressable>
    );
  };

  const renderServiceButton = () => {
    if (!onServicePress) return null;

    return (
      <Pressable hitSlop={10} style={styles.serviceButton} onPress={onServicePress}>
        <Ionicons name="settings" size={20} color={colors.text} />
      </Pressable>
    );
  };

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.container}>
        <View
          style={[
            styles.leftIconContainer,
            {
              backgroundColor:
                leftIconType === 'grid'
                  ? theme === 'dark'
                    ? colors.grayBackground
                    : 'rgba(173, 175, 176, 0.4)'
                  : 'transparent',
            },
          ]}
        >
          {renderLeftIcon()}
        </View>

        <Text
          style={[
            styles.titleText,
            titleAlignment === 'center' && styles.titleCenter,
            { color: colors.text },
          ]}
        >
          {title || TextString.DailySync}
        </Text>

        {__DEV__ && renderServiceButton()}

        <View style={styles.switchContainer}>
          {showThemeSwitch && <CustomSwitch isOn={theme !== 'dark'} onToggle={handleToggle} />}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIZE.appContainWidth,
    paddingVertical: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  titleText: {
    flex: 1,
    left: 17,
    fontSize: 24,
    fontFamily: FONTS.Medium,
  },
  titleCenter: {
    left: 15,
    textAlign: 'center',
  },
  iconButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchContainer: {
    width: 70,
    height: 35,
  },
  serviceButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: 'rgba(173, 175, 176, 0.2)',
    right: 10,
  },
});

export default memo(HomeHeader);

// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import React, { memo, useCallback } from 'react';
// import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
// import Animated, { FadeIn } from 'react-native-reanimated';

// import CustomSwitch from '../../../Components/CustomSwitch';
// import AssetsPath from '../../../Constants/AssetsPath';
// import TextString from '../../../Constants/TextString';
// import { FONTS, SIZE } from '../../../Constants/Theme';
// import { useAppContext } from '../../../Contexts/ThemeProvider';
// import useThemeColors from '../../../Hooks/useThemeMode';

// type LeftIconType = 'grid' | 'back' | 'none';

// interface IHomeHeaderProps {
//   title?: string;
//   leftIconType?: LeftIconType;
//   titleAlignment?: 'left' | 'center';
//   showThemeSwitch?: boolean;
//   onBackPress?: () => void;
//   onServicePress?: () => void;
// }

// const HomeHeader = ({
//   title,
//   leftIconType = 'grid',
//   titleAlignment = 'left',
//   showThemeSwitch = true,
//   onBackPress,
//   onServicePress,
// }: IHomeHeaderProps) => {
//   const colors = useThemeColors();
//   const navigation = useNavigation();
//   const { theme, toggleTheme, viewMode, toggleViewMode } = useAppContext();

//   const handleToggle = useCallback(
//     (state: boolean) => {
//       toggleTheme(state ? 'light' : 'dark');
//     },
//     [toggleTheme],
//   );

//   const renderLeftIcon = () => {
//     if (leftIconType === 'none') return null;

//     const icon = leftIconType === 'grid' ? AssetsPath.ic_menu : AssetsPath.ic_leftArrow;
//     const onPress =
//       leftIconType === 'grid'
//         ? () => toggleViewMode(viewMode === 'grid' ? 'list' : 'grid')
//         : () => onBackPress?.() || navigation.goBack();

//     return (
//       <Pressable hitSlop={10} style={styles.iconButton} onPress={onPress}>
//         <Image
//           source={icon}
//           style={styles.icon}
//           tintColor={leftIconType === 'back' ? colors.text : undefined}
//         />
//       </Pressable>
//     );
//   };

// const renderServiceButton = () => {
//   if (!onServicePress) return null;

//   return (
//     <Pressable hitSlop={10} style={styles.serviceButton} onPress={onServicePress}>
//       <Ionicons name="settings" size={20} color={colors.text} />
//     </Pressable>
//   );
// };

//   return (
//     <Animated.View entering={FadeIn.duration(400)}>
//       <View style={styles.container}>
//         <View
//           style={[
//             styles.leftIconContainer,
//             {
//               backgroundColor:
//                 leftIconType === 'grid'
//                   ? theme === 'dark'
//                     ? colors.grayBackground
//                     : 'rgba(173, 175, 176, 0.4)'
//                   : 'transparent',
//             },
//           ]}
//         >
//           {renderLeftIcon()}
//         </View>

//         <Text
//           style={[
//             styles.titleText,
//             titleAlignment === 'center' && styles.titleCenter,
//             { color: colors.text },
//           ]}
//         >
//           {title || TextString.DailySync}
//         </Text>

//         <View style={styles.rightContainer}>
//           {/* {renderServiceButton()} */}
//           {showThemeSwitch && <CustomSwitch isOn={theme !== 'dark'} onToggle={handleToggle} />}
//         </View>
//       </View>
//     </Animated.View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     width: SIZE.appContainWidth,
//     paddingVertical: 10,
//     alignSelf: 'center',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   leftIconContainer: {
//     width: 28,
//     height: 28,
//     borderRadius: 5,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   icon: {
//     width: 18,
//     height: 18,
//     resizeMode: 'contain',
//   },
//   titleText: {
//     flex: 1,
//     left: 17,
//     fontSize: 24,
//     fontFamily: FONTS.Medium,
//   },
//   titleCenter: {
//     left: 15,
//     textAlign: 'center',
//   },
//   iconButton: {
//     width: 28,
//     height: 28,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   rightContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
// serviceButton: {
//   width: 28,
//   height: 28,
//   alignItems: 'center',
//   justifyContent: 'center',
//   borderRadius: 5,
//   backgroundColor: 'rgba(173, 175, 176, 0.2)',
// },
//   switchContainer: {
//     width: 70,
//     height: 35,
//   },
// });

// export default memo(HomeHeader);
