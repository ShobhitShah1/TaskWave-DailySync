import React from "react";
import { Text, View } from "react-native";
import styles from "./styles";

const AddReminder = () => {
  const colors = styles();

  return (
    <View style={colors.container}>
      <Text>AddReminder</Text>
    </View>
  );
};

export default AddReminder;
