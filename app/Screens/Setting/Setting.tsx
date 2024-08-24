import React from "react";
import { Text, View } from "react-native";
import styles from "./styles";

const Setting = () => {
  const colors = styles();

  return (
    <View style={colors.container}>
      <Text>Setting</Text>
    </View>
  );
};

export default Setting;
