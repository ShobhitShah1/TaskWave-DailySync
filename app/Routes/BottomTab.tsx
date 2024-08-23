import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

//* Screens
import AddReminder from "../Screens/AddReminder/AddReminder";
import History from "../Screens/History/History";
import Home from "../Screens/Home/Home";
import Notification from "../Screens/Notification/Notification";
import Setting from "../Screens/Setting/Setting";

const Bottom = createBottomTabNavigator();

const BottomTab = () => {
  return (
    <Bottom.Navigator>
      <Bottom.Screen name="Home" component={Home} />
      <Bottom.Screen name="Notification" component={Notification} />
      <Bottom.Screen name="AddReminder" component={AddReminder} />
      <Bottom.Screen name="History" component={History} />
      <Bottom.Screen name="Setting" component={Setting} />
    </Bottom.Navigator>
  );
};

export default BottomTab;

const styles = StyleSheet.create({});
