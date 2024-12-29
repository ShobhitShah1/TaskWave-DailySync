import React from "react";
import { Image, StyleSheet } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import AssetsPath from "../Constants/AssetsPath";
import { FONTS } from "../Constants/Theme";
import { MenuItem } from "./ReminderCards/GridList";

export type props = {
  items: Array<{
    title: string;
    key: MenuItem;
  }>;
  color: string;
  onPress: (key: MenuItem) => void;
};

export default function DropMenu({ items, onPress, color }: props) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger style={styles.triggerContainer}>
        <Image
          tintColor={color}
          source={AssetsPath.ic_dotMenu}
          style={styles.menu}
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Group>
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.key}
              destructive={item.key === "delete"}
              onSelect={() => onPress(item.key)}
            >
              <DropdownMenu.ItemTitle
                style={{ fontFamily: FONTS.Medium, fontSize: 15 }}
              >
                {item.title}
              </DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

const styles = StyleSheet.create({
  menu: {
    width: "50%",
    height: "50%",
    resizeMode: "contain",
  },
  triggerContainer: {
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "flex-end",
  },
});
