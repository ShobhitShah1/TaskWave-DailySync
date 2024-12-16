import { StyleSheet } from "react-native";
import useThemeColors from "../../Hooks/useThemeMode";
import { FONTS } from "../../Constants/Theme";

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    text: {
      color: colors.text,
      fontSize: 18,
      fontFamily: FONTS.Medium,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 5,
    },
  });
};

export default styles;
