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
      marginVertical: 10,
    },
    headerContainer: {
      flexDirection: "row",
      height: 35,
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerIcon: {
      width: 20,
      height: 20,
      resizeMode: "contain",
    },
    headerText: {
      right: 8,
      fontSize: 22,
      fontFamily: FONTS.SemiBold,
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
      color: colors.white,
      textAlign: "center",
      fontFamily: FONTS.Medium,
      fontSize: 22,
    },
    itemsContainer: {
      marginTop: 20,
      marginBottom: 30,
    },
  });
};

export default styles;
