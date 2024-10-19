import React from "react";
import { Text, View } from "react-native";
import styles from "./styles";
import { SafeAreaView } from "react-native-safe-area-context";

const Notification = () => {
  const colors = styles();

  return (
    <SafeAreaView style={colors.container}>
      <Text style={[colors.text, { fontSize: 28 }]}>Coming Soon</Text>
    </SafeAreaView>
  );
};

export default Notification;
