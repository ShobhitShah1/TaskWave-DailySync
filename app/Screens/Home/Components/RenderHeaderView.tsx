import React, { FC, memo, useCallback } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import AssetsPath from "../../../Constants/AssetsPath";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import useNotificationIconColors from "../../../Hooks/useNotificationIconColors";
import useThemeColors from "../../../Hooks/useThemeMode";
import { headerInterface, NotificationType } from "../../../Types/Interface";
import { getCategories } from "../../../Utils/getCategories";
import styles from "../styles";
import { FilterButton } from "./FilterButton";

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
            contentContainerStyle={{
              gap: 5,
              alignItems: "center",
              overflow: "visible",
            }}
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
                  data={res}
                  key={res.id}
                  selectedFilter={selectedFilter}
                  onPress={() =>
                    handleSelectFilter(res.type as NotificationType)
                  }
                  backgroundColor={getColor?.backgroundColor || ""}
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
