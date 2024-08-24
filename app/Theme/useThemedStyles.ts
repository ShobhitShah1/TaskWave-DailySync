import { StyleSheet } from "react-native";
import useThemeColors from "./useThemeMode";

const useThemedStyles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    text: {
      color: colors.text,
      fontSize: 18,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 5,
    },
  });
};

export default useThemedStyles;
