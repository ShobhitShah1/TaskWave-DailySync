import React, { FC, memo } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { FONTS } from "../../../Global/Theme";
import useThemeColors from "../../../Theme/useThemeMode";

interface OnBoardingProps {
  item: any;
}

const OnBoardingListView: FC<OnBoardingProps> = ({ item }) => {
  const { width } = useWindowDimensions();
  const style = styles();

  return (
    <View key={item.id} style={[style.container, { width }]}>
      <Image
        resizeMode="cover"
        source={item?.image}
        style={[style.backgroundImage, { width }]}
      />

      <View style={style.TextViewContainer}>
        <Text style={style.TitleText}>{item.title}</Text>
        <Text style={style.DescriptionText}>{item.description}</Text>
      </View>
    </View>
  );
};

export default memo(OnBoardingListView);

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    backgroundImage: {
      flex: 0.7,
      height: 250,
    },
    TextViewContainer: {
      flex: 0.3,
      justifyContent: "center",
    },
    TitleText: {
      width: "95%",
      alignSelf: "center",
      fontSize: 26,
      textAlign: "center",
      marginBottom: 5,
      fontFamily: FONTS.SemiBold,
      color: colors.black,
    },
    DescriptionText: {
      width: "95%",
      fontSize: 18,
      alignSelf: "center",
      textAlign: "center",
      fontFamily: FONTS.Medium,
      color: "rgba(90, 90, 90, 1)",
    },
  });
};
