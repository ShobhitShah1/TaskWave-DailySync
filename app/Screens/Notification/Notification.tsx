import React from "react";
import { Text, View } from "react-native";
import styles from "./styles";

const Notification = () => {
  const colors = styles();

  return (
    <View style={colors.container}>
      <Text>Notification</Text>
    </View>
  );
};

export default Notification;
