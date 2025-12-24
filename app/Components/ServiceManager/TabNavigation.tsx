import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppContext } from '@Contexts/ThemeProvider';

interface TabNavigationProps {
  selectedTab: 'overview' | 'reminders' | 'advanced';
  onSelectTab: (tab: 'overview' | 'reminders' | 'advanced') => void;
  colors: any;
}

const tabData = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'reminders', label: 'Reminders', icon: 'location' },
  { key: 'advanced', label: 'Advanced', icon: 'settings' },
];

const TabNavigation: React.FC<TabNavigationProps> = ({ selectedTab, onSelectTab, colors }) => {
  const { theme } = useAppContext();
  const isDark = theme === 'dark';

  return (
    <View style={styles.tabNavigation}>
      {tabData.map((tab) => {
        const isSelected = selectedTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [
              styles.tabButton,
              isSelected
                ? {
                    backgroundColor: isDark ? colors.white : colors.primary,
                    borderRadius: 24,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.12,
                    shadowRadius: 8,
                    elevation: 6,
                    borderWidth: 0,
                    transitionDuration: '200ms',
                  }
                : {
                    backgroundColor: 'transparent',
                    borderRadius: 24,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    opacity: pressed ? 0.7 : 1,
                    transitionDuration: '200ms',
                  },
            ]}
            onPress={() => onSelectTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={isSelected ? (isDark ? colors.primary : colors.white) : colors.grayTitle}
            />
            <Text
              style={[
                styles.tabButtonText,
                {
                  color: isSelected ? (isDark ? colors.primary : colors.white) : colors.grayTitle,
                  fontWeight: isSelected ? 'bold' : 'normal',
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TabNavigation;
