import React, { memo, useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Modal from "react-native-modal";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { FONTS, SIZE } from "../Constants/Theme";
import useThemeColors from "../Hooks/useThemeMode";
import { BlurView } from "expo-blur";

interface YearMonthPickerProps {
  isVisible: boolean;
  startYear?: number;
  endYear?: number;
  selectedYear?: number;
  selectedMonth?: number;
  onConfirm: (year: number, month: number) => void;
  onCancel: () => void;
}

interface PickerItemProps {
  label: string;
  value: number;
  isSelected: boolean;
  onSelect: (value: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 10;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YearMonthPicker: React.FC<YearMonthPickerProps> = ({
  isVisible,
  startYear = 2024,
  endYear = 2040,
  selectedYear: initialSelectedYear,
  selectedMonth: initialSelectedMonth,
  onConfirm,
  onCancel,
}) => {
  const { height } = useWindowDimensions();
  const colors = useThemeColors();

  const years = useMemo(
    () =>
      Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i),
    [startYear, endYear]
  );

  const [selectedYear, setSelectedYear] = useState(
    initialSelectedYear || new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    initialSelectedMonth || new Date().getMonth()
  );

  const animationProgress = useSharedValue(1);
  const modalScale = useSharedValue(1);

  const handleConfirm = useCallback(() => {
    onConfirm(selectedYear, selectedMonth + 1);
  }, [selectedYear, selectedMonth, onConfirm]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animationProgress.value,
    // transform: [{ scale: modalScale.value }],
  }));

  const PickerItem: React.FC<PickerItemProps> = ({
    label,
    value,
    isSelected,
    onSelect,
  }) => {
    const itemScale = useSharedValue(1);

    const itemAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: isSelected ? itemScale.value : 1 }],
    }));

    return (
      <Pressable
        style={[
          styles.pickerItem,
          isSelected && { backgroundColor: "rgba(209, 209, 209, 0.5)" },
        ]}
        onPress={() => {
          itemScale.value = withTiming(1.1, { duration: 100 }, () => {
            itemScale.value = withTiming(1);
          });
          modalScale.value = withTiming(1.05, { duration: 100 }, () => {
            modalScale.value = withTiming(1);
          });
          onSelect(value);
        }}
      >
        <Animated.View style={itemAnimatedStyle}>
          <Text
            style={[
              styles.pickerItemText,
              { color: isSelected ? colors.darkBlue : "rgba(48, 51, 52, 0.7)" },
              isSelected && styles.selectedItemText,
            ]}
          >
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    );
  };

  const renderPickerColumn = useCallback(
    (
      data: any[],
      selectedValue: number,
      onSelectValue: (value: number) => void,
      valueToLabel: (value: number) => string
    ) => (
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <PickerItem
            label={valueToLabel(item)}
            value={item}
            isSelected={item === selectedValue}
            onSelect={onSelectValue}
          />
        )}
        keyExtractor={(item) => item.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        style={styles.pickerColumn}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialScrollIndex={
          data.indexOf(selectedValue) - Math.floor(VISIBLE_ITEMS / 2)
        }
      />
    ),
    [colors]
  );

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
      backdropOpacity={1}
      animationIn="fadeIn"
      animationOut="fadeOut"
      customBackdrop={
        <Pressable onPress={onCancel} style={{ flex: 1, height: height }}>
          <BlurView
            tint="dark"
            intensity={15}
            style={{ flex: 1, height: height }}
            experimentalBlurMethod="dimezisBlurView"
          />
        </Pressable>
      }
      hasBackdrop
      useNativeDriverForBackdrop
      // statusBarTranslucent
      // deviceHeight={height + ((StatusBar.currentHeight || 30) + 50)}
      useNativeDriver
      onModalShow={() => {
        animationProgress.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      }}
      onModalWillHide={() => {
        animationProgress.value = withTiming(0, {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        });
      }}
    >
      <View style={styles.centeredView}>
        <Animated.View
          style={[
            styles.modalView,
            {
              backgroundColor: colors.white,
              // shadowColor: colors.darkBlue,
            },
            animatedStyle,
          ]}
        >
          <View style={styles.pickerContainer}>
            {renderPickerColumn(years, selectedYear, setSelectedYear, (year) =>
              year.toString()
            )}
            {renderPickerColumn(
              MONTHS.map((_, index) => index),
              selectedMonth,
              setSelectedMonth,
              (monthIndex) => MONTHS[monthIndex]
            )}
          </View>
          <View style={styles.buttonContainer}>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: "rgba(217, 217, 217, 1)" },
              ]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: colors.black }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: colors.darkBlue }]}
              onPress={handleConfirm}
            >
              <Text style={[styles.buttonText, { color: colors.white }]}>
                Confirm
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    borderRadius: SIZE.listBorderRadius,
    padding: 20,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // elevation: 5,
    width: SCREEN_WIDTH * 0.85,
  },
  pickerContainer: {
    width: "100%",
    justifyContent: "space-between",
    flexDirection: "row",
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerItem: {
    width: "90%",
    left: 8,
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  pickerItemText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
  selectedItemText: {
    fontFamily: FONTS.SemiBold,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
  },
  button: {
    padding: 12,
    borderRadius: SIZE.listBorderRadius,
    width: "48%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16.5,
    fontFamily: FONTS.SemiBold,
  },
});

export default memo(YearMonthPicker);
