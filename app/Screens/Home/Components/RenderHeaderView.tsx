import React, { FC, memo, useCallback } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import AssetsPath from "../../../Constants/AssetsPath";
import useNotificationIconColors from "../../../Hooks/useNotificationIconColors";
import useThemeColors from "../../../Hooks/useThemeMode";
import { headerInterface, NotificationType } from "../../../Types/Interface";
import styles from "../styles";
import { getCategories } from "../../../Utils/getCategories";

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
    const shadowStyle = isSelected
      ? {
          shadowColor: "gray",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 15,
          elevation: 5,
        }
      : {};

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
        <View style={style.filterButtonsFlex}>
          <Pressable
            style={[
              style.filterAllBtn,
              { backgroundColor: colors.background },
              selectedFilter === "all" && {
                shadowColor: "gray",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 15,
                elevation: 5,
              },
            ]}
            onPress={() => setSelectedFilter("all")}
          >
            <Text style={style.filterAllText}>All</Text>
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
                onPress={() => handleSelectFilter(res.type as NotificationType)}
                icon={res.icon}
                color={res.color}
                backgroundColor={getColor?.backgroundColor || ""}
                style={style}
              />
            );
          })}
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
