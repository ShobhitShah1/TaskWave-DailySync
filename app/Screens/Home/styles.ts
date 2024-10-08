import { StyleSheet } from "react-native";
import { FONTS, SIZE } from "../../Global/Theme";
import useThemeColors from "../../Theme/useThemeMode";
import { useAppContext } from "../../Contexts/ThemeProvider";

const styles = () => {
  const colors = useThemeColors();
  const { theme } = useAppContext();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    homeContainContainer: {
      flex: 1,
      alignSelf: "center",
      width: SIZE.appContainWidth,
    },
    wrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
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
      gap: 10,
      flexDirection: "row",
      alignItems: "flex-end",
    },
    statusItem: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 500,
      marginRight: 5,
    },
    statusText: {
      color: colors.text,
      fontSize: 16,
      fontFamily: FONTS.Medium,
    },
    emptyViewContainer: {
      flex: 1,
      bottom: 15,
      justifyContent: "flex-end",
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
      color:
        theme === "dark"
          ? "rgba(255, 255, 255, 0.6)"
          : "rgba(139, 142, 142, 1)",
      fontFamily: FONTS.Medium,
    },
    emptyArrowRocket: {
      left: 25,
      height: 340,
      marginVertical: 10,
      alignSelf: "flex-end",
    },
    listHeaderView: {
      marginTop: 15,
      marginVertical: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerScheduleText: {
      color: colors.text,
      fontFamily: FONTS.Medium,
      fontSize: 21,
    },
    fullScreenIcon: {
      width: 18,
      height: 18,
    },
  });
};

export default styles;
