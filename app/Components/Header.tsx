import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { SIZE } from "../Global/Theme";

const Header = () => {
  return (
    <View style={styles.container}>
      <Pressable onPress={() => console.log("HELLO")}>
        <Text>Header</Text>
      </Pressable>
      <View>
        <Text>Header</Text>
      </View>
      <View>
        <Text>Header</Text>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    width: SIZE.appContainWidth,
  },
});
