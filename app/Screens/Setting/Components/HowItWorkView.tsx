import React, { FC } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import useThemeColors from "../../../Theme/useThemeMode";
import { FONTS } from "../../../Global/Theme";
import { useAppContext } from "../../../Contexts/ThemeProvider";

interface HowItWorkViewProps {
  item: any;
}

const HowItWorkView: FC<HowItWorkViewProps> = ({ item }) => {
  const { width } = useWindowDimensions();
  const { theme } = useAppContext();
  const colors = useThemeColors();

  return (
    <View
      key={item.id}
      style={[styles.container, { width, backgroundColor: colors.background }]}
    >
      <Image
        resizeMode="contain"
        source={item?.image?.[theme]}
        style={[styles.backgroundImage, { width }]}
      />

      <View style={{ flex: 0.1, justifyContent: "center", top: 10 }} />

      <View style={styles.textViewContainer}>
        <Text style={[styles.titleText, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.descriptionText, { color: colors.text }]}>
          {item.description}
        </Text>
      </View>
    </View>
  );
};

export default HowItWorkView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    overflow: "hidden",
    height: "15%",
  },
  textViewContainer: {
    flex: 0.25,
    overflow: "hidden",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 17,
    alignSelf: "center",
    fontFamily: FONTS.Bold,
    textAlign: "center",
  },
  descriptionText: {
    width: "85%",
    fontSize: 15,
    marginVertical: 5,
    alignSelf: "center",
    textAlign: "center",
    fontFamily: FONTS.Regular,
  },
});
