import React from "react";
import { Pressable, Text, View } from "react-native";
import { useAppContext } from "../../Contexts/ThemeProvider";
import styles from "./styles";

const Home = () => {
  const { theme, toggleTheme } = useAppContext();
  const colors = styles();

  return (
    <View style={colors.container}>
      <Pressable
        onPress={() => {
          toggleTheme(theme === "light" ? "dark" : "light");
        }}
      >
        <Text style={colors.text}>Press</Text>
      </Pressable>
    </View>
  );
};

export default Home;
