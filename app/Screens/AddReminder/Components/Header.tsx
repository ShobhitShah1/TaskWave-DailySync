import React from "react";
import { View, Pressable, Image, Text } from "react-native";
import AssetsPath from "../../../Constants/AssetsPath";

interface HeaderProps {
  onBackPress: () => void;
  title: string;
  themeColor: string;
  textColor?: string;
  style?: any;
}

const Header: React.FC<HeaderProps> = ({
  onBackPress,
  title,
  themeColor,
  textColor,
  style,
}) => {
  return (
    <View style={style?.headerContainer}>
      <Pressable hitSlop={10} onPress={onBackPress}>
        <Image
          tintColor={textColor || themeColor}
          source={AssetsPath.ic_leftArrow}
          style={style?.headerIcon}
        />
      </Pressable>
      <Text style={[style?.headerText, { color: themeColor }]}>{title}</Text>
      <View />
    </View>
  );
};

export default Header;
