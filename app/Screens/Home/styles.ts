import { StyleSheet } from "react-native";
import { FONTS, SIZE } from "../../Constants/Theme";
import useThemeColors from "../../Hooks/useThemeMode";
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
      justifyContent: "flex-end",
      alignItems: "center",
      flex: 1,
    },
    emptyDateTimeImage: {
      height: "50%",
      resizeMode: "contain",
      justifyContent: "center",
    },
    emptyTextContainer: {
      marginBottom: 10,
      height: "50%",
      justifyContent: "center",
      alignItems: "center",
    },
    emptyNoEventTitle: {
      fontSize: 24,
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
      height: "60%",
      top: 5,
      justifyContent: "flex-end",
      alignSelf: "flex-end",
    },
    listHeaderView: {
      marginTop: 15,
      marginVertical: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    // RenderHeaderView.tsx
    renderHeaderContainer: {
      width: "100%",
      marginVertical: 8,
      paddingVertical: 5,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    renderHeaderTitleView: {
      width: "30%",
    },
    renderHeaderListContainer: {
      top: -1,
      width: "65%",
      flexDirection: "row",
      alignItems: "center",
      alignContent: "flex-end",
      justifyContent: "flex-end",
    },
    headerScheduleText: {
      fontSize: 21,
      color: colors.text,
      fontFamily: FONTS.Medium,
    },
    fullscreenButton: {
      top: -1,
      width: 18,
      height: 18,
      marginHorizontal: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    fullScreenIcon: {
      width: "100%",
      height: "100%",
    },
    categoryFlatListContainContainer: {
      gap: 5,
      alignSelf: "flex-end",
    },
    filterAllBtn: {
      justifyContent: "center",
      alignItems: "center",
      width: 26,
      height: 26,
      borderRadius: 500,
      overflow: "hidden",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    filterAllText: {
      fontFamily: FONTS.Medium,
      textAlign: "center",
      fontSize: 15,
      right: 3,
    },
    filterBtn: {
      width: 26,
      height: 26,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 500,
    },
    filterIcon: {
      width: "50%",
      height: "50%",
    },
  });
};

export default styles;
