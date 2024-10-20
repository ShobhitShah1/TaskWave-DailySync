import React, { FC, memo, useCallback } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import AssetsPath from "../../../Global/AssetsPath";
import useNotificationIconColors from "../../../Hooks/useNotificationIconColors";
import useThemeColors from "../../../Theme/useThemeMode";
import { headerInterface, NotificationType } from "../../../Types/Interface";
import styles from "../styles";

const categories = (colors: any) => [
  {
    id: 1,
    type: "whatsapp",
    icon: AssetsPath.ic_whatsapp,
    color: colors.whatsapp,
  },
  {
    id: 2,
    type: "SMS",
    icon: AssetsPath.ic_sms,
    color: colors.sms,
  },
  {
    id: 3,
    type: "whatsappBusiness",
    icon: AssetsPath.ic_whatsappBusiness,
    color: colors.whatsappBusiness,
  },
  {
    id: 4,
    type: "gmail",
    icon: AssetsPath.ic_gmail,
    color: colors.gmail,
  },
  {
    id: 5,
    type: "phone",
    icon: AssetsPath.ic_phone,
    color: colors.sms,
  },
];

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

          {categories(colors).map((res) => {
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
                backgroundColor={getColor.backgroundColor}
                style={style}
              />
            );
          })}
        </View>

        <Pressable onPress={handleFullScreenPreview}>
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
