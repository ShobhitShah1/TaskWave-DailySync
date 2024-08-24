import React from "react";
import { Text, View } from "react-native";
import styles from "./styles";

const History = () => {
  const colors = styles();

  return (
    <View style={colors.container}>
      <Text>History</Text>
    </View>
  );
};

export default History;
