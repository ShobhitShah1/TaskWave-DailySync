import { StyleSheet } from "react-native";
import useThemeColors from "../../Theme/useThemeMode";
import { FONTS } from "../../Global/Theme";

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      width: "90%",
      flex: 1,
      alignSelf: "center",
      marginVertical: 15,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    headerIcon: {
      width: 20,
      height: 20,
      resizeMode: "contain",
    },
    headerText: {
      fontFamily: FONTS.SemiBold,
      fontSize: 20,
      right: 8,
    },
    createButton: {
      position: "absolute",
      bottom: 0,
      width: "100%",
      height: 43,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    createButtonText: {
      color: colors.text,
      textAlign: "center",
      fontFamily: FONTS.Medium,
      fontSize: 22,
    },
  });
};

export default styles;
