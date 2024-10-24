import { useIsFocused } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import React, {
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
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import RenderCalenderView from "../../Components/RenderCalenderView";
import YearMonthPicker from "../../Components/YearMonthPicker";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS, SIZE } from "../../Global/Theme";
import useCalendar from "../../Hooks/useCalendar";
import useReminder from "../../Hooks/useReminder";
import useThemeColors from "../../Theme/useThemeMode";
import { Notification } from "../../Types/Interface";
import { countNotificationsByType } from "../../Utils/countNotificationsByType";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDateAndYearModal, setShowDateAndYearModal] = useState(false);

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
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1
    );
    setCurrentMonth(newDate);
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1
    );
    setCurrentMonth(newDate);
  }, [currentMonth]);

  const filterTabData = useMemo(
    () => [
      {
        title: "Whatsapp",
        reminders: notificationCounts["whatsapp"] || 0,
        icon: AssetsPath.ic_whatsapp,
        type: "whatsapp",
        id: 1,
      },
      {
        title: "SMS",
        reminders: notificationCounts["SMS"] || 0,
        icon: AssetsPath.ic_sms,
        type: "SMS",
        id: 2,
      },
      {
        title: "Whatsapp Business",
        reminders: notificationCounts["whatsappBusiness"] || 0,
        icon: AssetsPath.ic_whatsappBusiness,
        type: "whatsappBusiness",
        id: 3,
      },
      {
        title: "Email",
        reminders: notificationCounts["gmail"] || 0,
        icon: AssetsPath.ic_gmail,
        type: "gmail",
        id: 4,
      },
      {
        title: "Phone",
        reminders: notificationCounts["phone"] || 0,
        icon: AssetsPath.ic_phone,
        type: "phone",
        id: 5,
      },
    ],
    [notificationCounts, notifications]
  );

  const findSelectedIndex = () => {
    return daysArray.findIndex((item) => item.formattedDate === selectedDate);
  };

  const scrollToIndex = async () => {
    if (flatListRef.current && isFocus) {
      const index = findSelectedIndex();
      if (index !== -1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        flatListRef.current.scrollToIndex({
          animated: true,
          index,
          viewPosition: 0.5,
        });
      }
    }
  };

  useEffect(() => {
    scrollToIndex();
  }, [selectedDate, isFocus, daysArray]);

  useEffect(() => {
    setLoading(filteredNotifications?.length === 0);
    loadNotifications();
  }, [isFocus, selectedDate, activeIndex]);

  const storeFilterData = useCallback(async () => {
    const selectedType = filterTabData?.[activeIndex].type;

    const data = selectedType
      ? notifications.filter(
          (notification) => notification.type === selectedType
        )
      : notifications;

    setFilteredNotifications(data || []);
  }, [notifications, activeIndex, selectedDate]);

  const loadNotifications = async () => {
    try {
      const allNotifications = await getAllNotifications();

      if (allNotifications && allNotifications.length > 0) {
        // const now = new Date();

        // const activeNotifications = allNotifications.filter(
        //   (notification) => new Date(notification.date) >= now
        // );

        const [day, month, year] = selectedDate.split("-");
        const selectedDateObj = new Date(`${year}-${month}-${day}`);

        if (isNaN(selectedDateObj.getTime())) {
          console.error("Invalid selectedDate:", selectedDate);
          return;
        }

        const filteredByDate = allNotifications.filter((notification) => {
          const notificationDate = new Date(
            notification.date
          ).toLocaleDateString();
          const selected = selectedDateObj.toLocaleDateString();
          return notificationDate === selected;
        });

        setNotifications(filteredByDate.reverse());

        if (filteredByDate.length !== 0) {
          setNotifications(filteredByDate.reverse());

          const selectedType =
            activeIndex === 0 ? "all" : filterTabData[activeIndex - 1].type;

          const data =
            activeIndex === 0
              ? filteredByDate
              : selectedType
                ? filteredByDate.filter(
                    (notification) => notification.type === selectedType
                  )
                : filteredByDate;

          setFilteredNotifications(data || []);
        } else {
          setNotifications([]);
          setFilteredNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = useCallback(
    (index: number) => {
      setActiveIndex(index);
      storeFilterData();
    },
    [filterTabData, notifications]
  );

  const deleteReminder = useCallback(async (id?: string) => {
    if (!id) {
      showMessage({
        message: "Invalid reminder ID",
        type: "danger",
      });
      return;
    }

    Alert.alert("Confirmation", "Are you sure you want to delete this?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: async () => {
          await deleteNotification(id);
          loadNotifications();
        },
      },
    ]);
  }, []);

  const handleDateChange = (year: number, month: number) => {
    const currentDay = selectedDateObject.getDate();

    const newDate = new Date(year, month - 1, currentDay);

    const formattedDate = newDate
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-");

    setSelectedDate(formattedDate);
    setSelectedDateObject(newDate);
    setCurrentMonth(newDate);
    setShowDateAndYearModal(false);
  };

  return (
    <SafeAreaView style={style.container}>
      <HomeHeader hideGrid={true} hideThemeButton={true} />

      <View style={style.contentView}>
        <View style={{ flex: 1 }}>
          <View style={style.headerContainer}>
            <Pressable onPress={() => setShowDateAndYearModal(true)}>
              <Text style={style.dateText}>
                {formatDate(selectedDateObject)}
              </Text>
            </Pressable>
            <View style={style.arrowContainer}>
              <Pressable
                onPress={() => goToPrevMonth()}
                style={style.arrowButton}
              >
                <Image
                  source={AssetsPath.ic_leftArrow}
                  style={style.arrowImage}
                />
              </Pressable>
              <Pressable
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
          ) : filteredNotifications?.length === 0 ? (
            <View style={style.emptyListView}>
              <Text style={style.emptyListText}>No Notifications Found</Text>
            </View>
          ) : (
            <FlashList
              ref={flashListRef}
              extraData={
                selectedDate ||
                activeIndex ||
                filteredNotifications ||
                notifications
              }
              estimatedItemSize={300}
              data={filteredNotifications}
              stickyHeaderHiddenOnScroll={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => (
                <RenderHistoryList
                  notification={item}
                  deleteReminder={deleteReminder}
                />
              )}
            />
          )}
        </View>

        <View style={style.tabsContainer}>
          <View style={{ width: "20%" }}>
            <RenderFilterTabData
              index={0}
              isActive={activeIndex === 0}
              onTabPress={() => handleTabPress(0)}
              res={{
                title: "All",
                type: null,
                icon: null,
                reminders: notifications?.length,
              }}
            />
          </View>

          <View style={{ width: "80%", overflow: "visible" }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filterTabData.map((res, index) => {
                const isActive = res.id === activeIndex;

                const onTabPress = () => {
                  if (isActive) {
                    if (flashListRef.current) {
                      flashListRef.current?.scrollToOffset({
                        animated: true,
                        offset: 0,
                      });
                    }
                  } else {
                    handleTabPress(res.id);
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

export default History;

const styles = () => {
  const colors = useThemeColors();

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
      backgroundColor: colors.placeholderText,
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
