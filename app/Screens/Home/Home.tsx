import React from "react";
import { View } from "react-native";
import HomeHeader from "./Components/HomeHeader";
import styles from "./styles";

const Home = () => {
  const colors = styles();

  return (
    <View style={colors.container}>
      <HomeHeader />
    </View>
  );
};

export default Home;
