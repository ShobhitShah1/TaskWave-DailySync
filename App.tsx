import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Routes from "./app/Routes/Routes";
import { AppProvider } from "./app/Contexts/ThemeProvider";

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AppProvider>
        <Routes />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
