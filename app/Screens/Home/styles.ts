import { StyleSheet } from "react-native";
import useThemeColors from "../../Theme/useThemeMode";
import { FONTS, SIZE } from "../../Global/Theme";

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    wrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: SIZE.appContainWidth,
      alignSelf: "center",
      marginVertical: 10,
    },
    dateContainer: {
      rowGap: 8,
    },
    todayText: {
      color: colors.grayTitle,
      fontSize: 19,
      fontFamily: FONTS.Medium,
    },
    dateText: {
      color: colors.text,
      fontSize: 19.5,
      fontFamily: FONTS.Medium,
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    statusItem: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 5,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 500,
      marginRight: 6,
    },
    statusText: {
      color: colors.text,
      fontSize: 16,
      fontFamily: FONTS.Medium,
    },
    emptyViewContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyDateTimeImage: {
      width: 90,
      height: 90,
      justifyContent: "center",
    },
    emptyTextContainer: {
      marginVertical: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyNoEventTitle: {
      fontSize: 25,
      color: colors.text,
      fontFamily: FONTS.Medium,
    },
    emptyListText: {
      fontSize: 17,
      marginTop: 5,
      color: colors.text,
      fontFamily: FONTS.Medium,
    },
    emptyArrowRocket: {
      height: 380,
      left: 30,
      top: 10,
      marginTop: 20,
      marginVertical: 10,
      alignSelf: "flex-end",
    },
  });
};

export default styles;
