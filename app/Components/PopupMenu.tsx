import React, { FC, useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MENU_WIDTH = 160;
const MENU_ITEM_HEIGHT = 44;
const MENU_PADDING = 8;
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
  mass: 0.6,
};

export interface PopupMenuItem {
  id: string;
  title: string;
  destructive?: boolean;
  disabled?: boolean;
}

interface PopupMenuProps {
  children: React.ReactNode;
  actions: PopupMenuItem[];
  onPress: (item: PopupMenuItem, index: number) => void;
}

interface MenuPosition {
  x: number;
  y: number;
  showAbove: boolean;
  showLeft: boolean;
}

const PopupMenu: FC<PopupMenuProps> = ({ children, actions, onPress }) => {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    x: 0,
    y: 0,
    showAbove: false,
    showLeft: false,
  });
  const triggerRef = useRef<View>(null);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const menuHeight = actions.length * MENU_ITEM_HEIGHT + MENU_PADDING * 2;

  const calculatePosition = useCallback(() => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        // Calculate if menu should appear above or below
        const spaceBelow = SCREEN_HEIGHT - (y + height);
        const spaceAbove = y;
        const showAbove = spaceBelow < menuHeight + 20 && spaceAbove > menuHeight + 20;

        // Calculate if menu should appear left or right
        const spaceRight = SCREEN_WIDTH - x;
        const showLeft = spaceRight < MENU_WIDTH + 20;

        // Calculate final position
        let finalX = showLeft ? x + width - MENU_WIDTH : x;
        let finalY = showAbove ? y - menuHeight - 5 : y + height + 5;

        // Clamp to screen bounds
        finalX = Math.max(10, Math.min(finalX, SCREEN_WIDTH - MENU_WIDTH - 10));
        finalY = Math.max(10, Math.min(finalY, SCREEN_HEIGHT - menuHeight - 10));

        setMenuPosition({
          x: finalX,
          y: finalY,
          showAbove,
          showLeft,
        });

        setVisible(true);
        scale.value = withSpring(1, SPRING_CONFIG);
        opacity.value = withTiming(1, { duration: 150 });
      });
    }
  }, [menuHeight, scale, opacity]);

  const handleClose = useCallback(() => {
    scale.value = withSpring(0.8, { ...SPRING_CONFIG, damping: 20 });
    opacity.value = withTiming(0, { duration: 100 }, () => {
      runOnJS(setVisible)(false);
    });
  }, [scale, opacity]);

  const handleItemPress = useCallback(
    (item: PopupMenuItem, index: number) => {
      if (item.disabled) return;
      handleClose();
      // Delay the action to allow animation to complete
      setTimeout(() => {
        onPress(item, index);
      }, 150);
    },
    [handleClose, onPress],
  );

  const menuAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        {
          translateY: menuPosition.showAbove
            ? (1 - scale.value) * (menuHeight / 2)
            : (1 - scale.value) * (-menuHeight / 2),
        },
      ],
      opacity: opacity.value,
    };
  });

  // Use theme colors for menu background
  const menuBgColor = colors.background;
  const separatorColor = colors.borderColor;

  return (
    <>
      <Pressable ref={triggerRef} onPress={calculatePosition} hitSlop={10}>
        {children}
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Animated.View
            style={[
              styles.menuContainer,
              menuAnimatedStyle,
              {
                left: menuPosition.x,
                top: menuPosition.y,
                backgroundColor: menuBgColor,
                transformOrigin: menuPosition.showAbove
                  ? menuPosition.showLeft
                    ? 'bottom right'
                    : 'bottom left'
                  : menuPosition.showLeft
                    ? 'top right'
                    : 'top left',
              },
            ]}
          >
            {actions.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => handleItemPress(item, index)}
                  disabled={item.disabled}
                  style={[styles.menuItem, item.disabled && styles.menuItemDisabled]}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: colors.text },
                      item.destructive && styles.menuItemDestructive,
                      item.disabled && styles.menuItemTextDisabled,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
                {index < actions.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                )}
              </React.Fragment>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    width: MENU_WIDTH,
    borderRadius: 14,
    paddingVertical: MENU_PADDING,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  menuItem: {
    height: MENU_ITEM_HEIGHT,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  menuItemDisabled: {
    opacity: 0.4,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
  menuItemDestructive: {
    color: '#FF3B30',
  },
  menuItemTextDisabled: {
    opacity: 0.5,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
  },
});

export default PopupMenu;
