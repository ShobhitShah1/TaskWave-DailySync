import { StyleSheet } from "react-native";
import useThemeColors from "../../Theme/useThemeMode";

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    text: {
      fontSize: 18,
      color: colors.text,
    },
  });
};

export default styles;
