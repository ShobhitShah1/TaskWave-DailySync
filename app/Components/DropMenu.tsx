import React from "react";
import { Image, StyleSheet } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import AssetsPath from "../Constants/AssetsPath";

export type props = {
  items: Array<{
    title: string;
    key: string;
  }>;
  color: string;
  onPress: (key: string) => void;
};

export default function DropMenu({ items, onPress, color }: props) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Image
          tintColor={color}
          source={AssetsPath.ic_dotMenu}
          style={styles.menu}
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item key="1">
          <DropdownMenu.ItemTitle>Option Menu</DropdownMenu.ItemTitle>
        </DropdownMenu.Item>

        <DropdownMenu.Group>
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.key}
              onSelect={() => onPress(item.key)}
            >
              <DropdownMenu.ItemTitle>{item.title}</DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

const styles = StyleSheet.create({
  menu: {
    width: 12.5,
    height: 12.5,
    resizeMode: "contain",
  },
});
