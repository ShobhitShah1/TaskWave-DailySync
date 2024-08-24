import { StatusBar, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Routes from "./app/Routes/Routes";
import { AppProvider } from "./app/Contexts/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import useThemedStyles from "./app/Theme/useThemedStyles";
import useThemeColors from "./app/Theme/useThemeMode";

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <AppProvider>
          <Routes />
        </AppProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
