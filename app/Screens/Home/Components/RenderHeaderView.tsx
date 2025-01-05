import React, { FC, memo, useCallback } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  ViewStyle,
} from "react-native";
import AssetsPath from "../../../Constants/AssetsPath";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import useNotificationIconColors from "../../../Hooks/useNotificationIconColors";
import useThemeColors from "../../../Hooks/useThemeMode";
import { headerInterface, NotificationType } from "../../../Types/Interface";
import { getCategories } from "../../../Utils/getCategories";
import styles from "../styles";

const FilterButton = memo(
  ({
    filterType,
    selectedFilter,
    onPress,
    icon,
    color,
    backgroundColor,
    style,
  }: any) => {
    const isSelected = selectedFilter === filterType;
    const shadowStyle: ViewStyle = isSelected
      ? { opacity: 1, overflow: "hidden" }
      : { opacity: 0.6 };

    return (
      <Pressable
        style={[style.filterBtn, { backgroundColor }, shadowStyle]}
        onPress={onPress}
      >
        <Image
          source={icon}
          tintColor={filterType === "gmail" ? undefined : color}
          style={style.filterIcon}
        />
      </Pressable>
    );
  }
);

const RenderHeaderView: FC<headerInterface> = ({
  selectedFilter,
  setSelectedFilter,
  notificationsState,
  setFullScreenPreview,
}) => {
  const style = styles();
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const initialCategories = getCategories(colors);

  const handleSelectFilter = useCallback(
    (filter: NotificationType) => setSelectedFilter(filter),
    [setSelectedFilter]
  );

  const handleFullScreenPreview = useCallback(() => {
    if (notificationsState.allByDate.length > 0) {
      setFullScreenPreview(true);
    }
  }, [notificationsState, setFullScreenPreview]);

  return (
    <View style={style.listHeaderView}>
      <Text style={style.headerScheduleText}>Schedule</Text>
      <View style={style.filterOptionContainer}>
        <View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            horizontal
            contentContainerStyle={{ gap: 5 }}
            style={style.filterButtonsFlex}
          >
            <Pressable
              style={[
                style.filterAllBtn,
                { backgroundColor: colors.background },
              ]}
              onPress={() => setSelectedFilter("all")}
            >
              <Text
                style={[
                  style.filterAllText,
                  {
                    color:
                      selectedFilter === "all" ? colors.text : colors.grayTitle,
                  },
                ]}
              >
                All
              </Text>
            </Pressable>

            {initialCategories.map((res) => {
              const getColor = useNotificationIconColors(
                res.type as NotificationType
              );
              return (
                <FilterButton
                  key={res.id}
                  filterType={res.type}
                  selectedFilter={selectedFilter}
                  onPress={() =>
                    handleSelectFilter(res.type as NotificationType)
                  }
                  icon={res.icon}
                  color={res.color}
                  backgroundColor={getColor?.backgroundColor || ""}
                  style={style}
                />
              );
            })}
          </ScrollView>
        </View>

        <Pressable
          style={style.fullscreenButton}
          onPress={handleFullScreenPreview}
        >
          <Image
            resizeMode="contain"
            tintColor={theme === "light" ? colors.sms : colors.text}
            source={AssetsPath.ic_fullScreen}
            style={style.fullScreenIcon}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default memo(RenderHeaderView);
