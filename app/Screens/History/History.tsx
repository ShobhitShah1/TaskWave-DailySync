import { useIsFocused } from "@react-navigation/native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import Animated, { LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import RenderCalenderView from "../../Components/RenderCalenderView";
import YearMonthPicker from "../../Components/YearMonthPicker";
import AssetsPath from "../../Constants/AssetsPath";
import { categoriesConfig } from "../../Constants/CategoryConfig";
import { FONTS, SIZE } from "../../Constants/Theme";
import { useAppContext } from "../../Contexts/ThemeProvider";
import useCalendar from "../../Hooks/useCalendar";
import useReminder from "../../Hooks/useReminder";
import useThemeColors from "../../Hooks/useThemeMode";
import { Notification } from "../../Types/Interface";
import { countNotificationsByType } from "../../Utils/countNotificationsByType";
import { formatNotificationType } from "../../Utils/formatNotificationType";
import { generateDaysArray } from "../../Utils/generateDaysArray";
import { formatDate } from "../AddReminder/ReminderScheduled";
import HomeHeader from "../Home/Components/HomeHeader";
import RenderFilterTabData from "./Components/RenderFilterTabData";
import RenderHistoryList from "./Components/RenderHistoryList";

const History = () => {
  const style = styles();
  const colors = useThemeColors();
  const flashListRef = useRef<any>(null);
  const isFocus = useIsFocused();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [activeTabType, setActiveTabType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showDateAndYearModal, setShowDateAndYearModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const notificationCounts = useMemo(
    () => countNotificationsByType(notifications),
    [notifications]
  );

  const { getAllNotifications, deleteNotification } = useReminder();
  const {
    handleDayClick,
    selectedDateObject,
    selectedDate,
    setSelectedDate,
    setSelectedDateObject,
    setCurrentMonth,
    currentMonth,
  } = useCalendar(new Date());

  const flatListRef = useRef<FlatList>(null);

  const [daysArray, setDaysArray] = useState(() =>
    generateDaysArray(new Date())
  );

  useEffect(() => {
    setDaysArray(generateDaysArray(currentMonth));
  }, [currentMonth]);

  const goToPrevMonth = useCallback(() => {
    try {
      const currentDay = selectedDateObject.getDate();
      const newDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        currentDay
      );

      const formattedDate = newDate
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");

      setSelectedDate(formattedDate);
      setSelectedDateObject(newDate);
      setCurrentMonth(newDate);
    } catch (error: any) {
      showMessage({ message: error?.message?.toString(), type: "danger" });
    }
  }, [currentMonth, selectedDateObject]);

  const goToNextMonth = useCallback(() => {
    try {
      const currentDay = selectedDateObject.getDate();
      const newDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        currentDay
      );

      const formattedDate = newDate
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");

      setSelectedDate(formattedDate);
      setSelectedDateObject(newDate);
      setCurrentMonth(newDate);
    } catch (error: any) {
      showMessage({ message: error?.message?.toString(), type: "danger" });
    }
  }, [currentMonth, selectedDateObject]);

  const filterTabData = useMemo(() => {
    const enrichedCategories = categoriesConfig(colors).map((category) => ({
      ...category,
      title:
        category.type === "whatsappBusiness"
          ? "WA Business"
          : formatNotificationType(category.type),
      reminders: notificationCounts[category.type] || 0,
    }));
    return enrichedCategories;
  }, [colors, notificationCounts]);

  const selectedType = useMemo(
    () =>
      activeTabType === "all"
        ? "all"
        : filterTabData.find((tab) => tab.type === activeTabType)?.type,
    [activeTabType, filterTabData]
  );

  const findSelectedIndex = () => {
    const index = daysArray.findIndex(
      (item) => item.formattedDate === selectedDate
    );
    return index !== -1 ? index : 0;
  };

  const scrollToIndex = useCallback(() => {
    try {
      if (flatListRef.current && isFocus) {
        const index = findSelectedIndex();
        flatListRef.current.scrollToIndex({
          animated: true,
          index: index !== -1 ? index : 0,
          viewPosition: 0.5,
        });
      }
    } catch (error) {}
  }, [flatListRef, isFocus]);

  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      if (flatListRef.current) {
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.5,
            });
          }
        }, 100);
      }
    },
    []
  );

  useEffect(() => {
    if (isFocus) {
      scrollToIndex();
    }
  }, [selectedDate, isFocus, daysArray]);

  useEffect(() => {
    if (isFocus) {
      setLoading(notifications?.length === 0);
      loadNotifications();
    }
  }, [selectedDate, activeTabType, isFocus]);

  useEffect(() => {
    filterNotifications();
  }, [activeTabType, filterTabData]);

  const filterNotificationsByDate = useCallback(
    (allNotifications: Notification[]) => {
      const [day, month, year] = selectedDate.split("-");
      const selectedDateObj = new Date(`${year}-${month}-${day}`);

      if (isNaN(selectedDateObj.getTime())) {
        showMessage({
          message: `Invalid selected date: ${selectedDate}`,
          type: "danger",
        });
        return [];
      }

      return allNotifications.filter((notification) => {
        const notificationDate = new Date(
          notification.date
        ).toLocaleDateString();
        const selected = selectedDateObj.toLocaleDateString();
        return notificationDate === selected;
      });
    },
    [selectedDate]
  );

  const applyTypeFilter = useCallback(
    (notifications: Notification[]) => {
      if (activeTabType === "all") return notifications;
      return selectedType
        ? notifications.filter(
            (notification) => notification.type === selectedType
          )
        : notifications;
    },
    [activeTabType, selectedType]
  );

  const loadNotifications = useCallback(async () => {
    try {
      const allNotifications = await getAllNotifications();
      if (!allNotifications?.length) {
        setNotifications([]);
        setFilteredNotifications([]);
        return;
      }

      const dateFiltered = filterNotificationsByDate(allNotifications);
      const typeFiltered = applyTypeFilter(dateFiltered);

      const sortedTypeFiltered = typeFiltered.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setNotifications(dateFiltered);
      setFilteredNotifications(sortedTypeFiltered);

      return typeFiltered;
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : "An error occurred",
        type: "danger",
      });
      setNotifications([]);
      setFilteredNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [
    selectedDate,
    activeTabType,
    selectedType,
    filterNotificationsByDate,
    applyTypeFilter,
  ]);

  const filterNotifications = useCallback(async () => {
    try {
      const data =
        activeTabType === "all"
          ? notifications
          : selectedType
          ? notifications.filter(
              (notification) => notification.type === selectedType
            )
          : notifications;

      const filterData = data?.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setFilteredNotifications(filterData);
    } catch (error: any) {
      showMessage({
        message: error?.message?.toString(),
        type: "danger",
      });
    }
  }, [activeTabType, selectedType, notifications]);

  const handleTabPress = useCallback((type: string) => {
    setActiveTabType(type);
  }, []);

  const deleteReminder = useCallback(async (id?: string) => {
    if (!id) {
      showMessage({
        message: "Invalid reminder ID",
        type: "danger",
      });
      return;
    }

    Alert.alert(
      "Confirmation",
      "Are you sure you want to delete this event? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            await deleteNotification(id);
            await loadNotifications();
          },
        },
      ]
    );
  }, []);

  const handleDateChange = (year: number, month: number) => {
    try {
      const currentDay = selectedDateObject.getDate();

      const newDate = new Date(year, month - 1, currentDay);

      const formattedDate = newDate
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");

      setSelectedDate(formattedDate);
      setSelectedDateObject(newDate);
      setCurrentMonth(newDate);
      setShowDateAndYearModal(false);
    } catch (error: any) {
      showMessage({ message: error?.message?.toString(), type: "danger" });
    }
  };

  const RenderEmptyView = () => {
    return (
      <View style={style.emptyListView}>
        <Text style={style.emptyListText}>No Notifications Found</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={style.container}>
      <HomeHeader
        title={"History"}
        titleAlignment="center"
        leftIconType="back"
        showThemeSwitch={false}
      />

      <View style={style.contentView}>
        <View style={{ flex: 1 }}>
          <View style={style.headerContainer}>
            <Pressable
              hitSlop={6}
              onPress={() => setShowDateAndYearModal(true)}
            >
              <Text style={style.dateText}>
                {formatDate(selectedDateObject)}
              </Text>
            </Pressable>
            <View style={style.arrowContainer}>
              <Pressable
                hitSlop={5}
                onPress={() => goToPrevMonth()}
                style={style.arrowButton}
              >
                <Image
                  source={AssetsPath.ic_leftArrow}
                  style={style.arrowImage}
                />
              </Pressable>
              <Pressable
                hitSlop={5}
                onPress={() => goToNextMonth()}
                style={style.arrowButton}
              >
                <Image
                  source={AssetsPath.ic_leftArrow}
                  style={[
                    style.arrowImage,
                    { transform: [{ rotate: "180deg" }] },
                  ]}
                />
              </Pressable>
            </View>
          </View>

          <Animated.View style={{ marginVertical: 10 }}>
            <FlatList
              horizontal
              ref={flatListRef}
              data={daysArray}
              onLayout={() => scrollToIndex()}
              onScrollToIndexFailed={handleScrollToIndexFailed}
              onContentSizeChange={() => scrollToIndex()}
              contentContainerStyle={{ gap: 20 }}
              renderItem={({ index, item }) => {
                return (
                  <RenderCalenderView
                    item={item}
                    index={index}
                    handleDayClick={handleDayClick}
                    selectedDate={selectedDate}
                  />
                );
              }}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
            />
          </Animated.View>

          {loading ? (
            <View style={style.loaderView}>
              <ActivityIndicator color={colors.text} size="large" />
            </View>
          ) : (
            <Animated.FlatList
              ref={flashListRef}
              extraData={
                selectedDate ||
                activeTabType ||
                filteredNotifications ||
                notifications
              }
              refreshControl={
                <RefreshControl
                  onRefresh={async () => {
                    try {
                      setRefreshing(true);
                      await loadNotifications();
                      setRefreshing(false);
                    } catch (error) {
                      setRefreshing(false);
                    }
                  }}
                  colors={[colors.text]}
                  refreshing={refreshing}
                  progressBackgroundColor={colors.background}
                />
              }
              layout={LinearTransition}
              itemLayoutAnimation={LinearTransition.springify()
                .damping(80)
                .stiffness(200)}
              data={filteredNotifications}
              onScrollToIndexFailed={() => {}}
              stickyHeaderHiddenOnScroll={true}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              keyExtractor={(item, index) => item?.id?.toString()}
              contentContainerStyle={{
                paddingBottom: 120,
                flex: filteredNotifications?.length === 0 ? 1 : undefined,
              }}
              renderItem={({ item }) => (
                <RenderHistoryList
                  notification={item}
                  deleteReminder={deleteReminder}
                  loadNotifications={loadNotifications}
                />
              )}
              ListEmptyComponent={<RenderEmptyView />}
            />
          )}
        </View>

        <View style={style.tabsContainer}>
          <View
            style={{
              width: "17.5%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RenderFilterTabData
              index={0}
              isActive={activeTabType === "all"}
              onTabPress={() => {
                if (activeTabType === "all") return;
                handleTabPress("all");
              }}
              res={{
                title: "All",
                type: null,
                icon: null,
                history_icon: null,
                reminders: notifications?.length,
              }}
            />
          </View>

          <View style={{ width: "80%", overflow: "visible" }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filterTabData.map((res, index) => {
                const isActive = res.type === activeTabType;

                const onTabPress = () => {
                  if (isActive) {
                    if (flashListRef.current) {
                      flashListRef.current?.scrollToOffset({
                        animated: true,
                        offset: 0,
                      });
                    }
                  } else {
                    handleTabPress(res.type);
                  }
                };

                return (
                  <RenderFilterTabData
                    key={index}
                    index={res.id}
                    isActive={isActive}
                    onTabPress={onTabPress}
                    res={res}
                  />
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>

      {showDateAndYearModal && (
        <YearMonthPicker
          isVisible={showDateAndYearModal}
          selectedYear={selectedDateObject.getFullYear()}
          selectedMonth={selectedDateObject.getMonth()}
          onConfirm={handleDateChange}
          onCancel={() => setShowDateAndYearModal(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default memo(History);

const styles = () => {
  const colors = useThemeColors();
  const { theme } = useAppContext();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentView: {
      flex: 1,
      width: SIZE.appContainWidth,
      alignSelf: "center",
    },
    tabsContainer: {
      bottom: 38,
      height: 68,
      width: "100%",
      elevation: 5,
      borderRadius: 10,
      shadowColor: "#000",
      position: "absolute",
      flexDirection: "row",
      alignItems: "center",
      shadowOpacity: 0.3,
      shadowRadius: 3.84,
      overflow: "visible",
      justifyContent: "space-around",
      backgroundColor: colors.scheduleReminderCardBackground,
      shadowOffset: { width: 0, height: 2 },
    },
    tabButton: {
      flex: 1,
      height: "98%",
      alignItems: "center",
      justifyContent: "center",
    },
    tabContainer: {
      flex: 1,
      width: "95%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    activeTab: {
      flex: 1,
      justifyContent: "center",
      borderRadius: 10,
      backgroundColor: "rgba(38, 107, 235, 1)",
    },
    iconStyle: {
      width: 20,
      height: 20,
      marginBottom: 10,
    },
    tabTitle: {
      rowGap: 10,
      fontFamily: FONTS.Medium,
    },
    badgeContainer: {
      position: "absolute",
      top: -5,
      right: 0,
      borderRadius: 50,
      width: 22,
      height: 22,
      justifyContent: "center",
      alignItems: "center",
    },
    badgeText: {
      fontSize: 12,
      textAlign: "center",
      color: colors.black,
      fontFamily: FONTS.Medium,
    },
    loaderView: {
      flex: 1,
      marginBottom: 80,
      alignItems: "center",
      justifyContent: "center",
    },

    headerContainer: {
      flexDirection: "row",
      marginVertical: 5,
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateText: {
      fontFamily: FONTS.Medium,
      fontSize: 20,
      color: colors.text,
    },
    arrowContainer: {
      flexDirection: "row",
      gap: 10,
    },
    arrowButton: {
      width: 27,
      height: 27,
      borderRadius: 5,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor:
        theme === "light" ? "rgba(209, 209, 209, 0.5)" : colors.placeholderText,
    },
    arrowImage: {
      width: "50%",
      height: "50%",
      resizeMode: "contain",
      tintColor: colors.black,
    },
    emptyListView: {
      flex: 1,
      marginBottom: 80,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyListText: {
      textAlign: "center",
      color: colors.text,
      fontFamily: FONTS.SemiBold,
      fontSize: 20,
    },
  });
};
