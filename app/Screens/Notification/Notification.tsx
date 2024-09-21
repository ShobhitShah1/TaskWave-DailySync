import React from "react";
import { Text, View } from "react-native";
import styles from "./styles";

const Notification = () => {
  const colors = styles();

  return (
    <View style={colors.container}>
      <Text style={colors.text}>Notification</Text>
    </View>
  );
};

export default Notification;
