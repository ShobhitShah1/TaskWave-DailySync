import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import FullScreenPreviewModal from "../../Components/FullScreenPreviewModal";
import ReminderCard from "../../Components/ReminderCard";
import RenderCalenderView from "../../Components/RenderCalenderView";
import YearMonthPicker from "../../Components/YearMonthPicker";
import { useAppContext } from "../../Contexts/ThemeProvider";
import AssetsPath from "../../Global/AssetsPath";
import useCalendar from "../../Hooks/useCalendar";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import useNotificationPermission from "../../Hooks/useNotificationPermission";
import { default as useDatabase } from "../../Hooks/useReminder";
import useThemeColors from "../../Theme/useThemeMode";
import { Notification, NotificationType } from "../../Types/Interface";
import { fromNowText } from "../../Utils/isSameDat";
import { formatDate } from "../AddReminder/ReminderScheduled";
import HomeHeader from "./Components/HomeHeader";
import RenderEmptyView from "./Components/RenderEmptyView";
import styles from "./styles";

const Home = () => {
  const style = styles();
  const colors = useThemeColors();
  const isFocus = useIsFocused();
  const { height } = useWindowDimensions();
  const { theme } = useAppContext();

  const flatListRef = useRef<FlatList>(null);
  const { getAllNotifications, deleteNotification } = useDatabase();
  const { permissionStatus, requestPermission } = useNotificationPermission();

  const {
    daysArray,
    handleDayClick,
    selectedDate,
    selectedDateObject,
    setSelectedDate,
    setSelectedDateObject,
    setCurrentMonth,
  } = useCalendar(new Date());

  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const [showDateAndYearModal, setShowDateAndYearModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [notificationsState, setNotificationsState] = useState({
    all: [] as Notification[],
    allByDate: [] as Notification[],
    active: [] as Notification[],
    inactive: [] as Notification[],
  });
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedFilter, setSelectedFilter] = useState<
    NotificationType | "all"
  >("all");

  const findSelectedIndex = () => {
    return daysArray.findIndex((item) => item.formattedDate === selectedDate);
  };

  const scrollToIndex = async () => {
    if (flatListRef.current && isFocus) {
      const index = findSelectedIndex();

      if (index >= 0 && index <= daysArray.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        flatListRef.current.scrollToIndex({
          animated: true,
          index,
          viewPosition: 0.5,
        });
      } else {
        console.warn("Invalid index:", index);
      }
    }
  };

  useEffect(() => {
    scrollToIndex();
  }, [selectedDate, isFocus, notificationsState, flatListRef.current]);

  useEffect(() => {
    if (isFocus) {
      setIsLoading(notificationsState?.allByDate?.length === 0);
      loadNotifications();
    }
  }, [isFocus, selectedDate, selectedFilter]);

  useEffect(() => {
    if (permissionStatus !== "granted") {
      requestPermission();
    }
  }, [permissionStatus]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadNotifications();
      setRefreshing(false);
    } catch (error) {
      setRefreshing(false);
    }
  }, []);

  const categories = [
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

  const loadNotifications = async () => {
    try {
      const allNotifications = await getAllNotifications();
      const now = new Date();

      const active = allNotifications
        .filter(
          (notification) =>
            new Date(notification.date).getTime() >= now.getTime()
        )
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      const inactive = allNotifications
        .filter(
          (notification) =>
            new Date(notification.date).getTime() < now.getTime()
        )
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      const [day, month, year] = selectedDate.split("-");
      const selectedDateObj = new Date(`${year}-${month}-${day}`);

      if (isNaN(selectedDateObj.getTime())) {
        console.error("Invalid selectedDate:", selectedDate);
        return;
      }

      const filteredByType =
        selectedFilter === "all"
          ? [...active, ...inactive]
          : [
              ...active.filter(
                (notification) => notification.type === selectedFilter
              ),
              ...inactive.filter(
                (notification) => notification.type === selectedFilter
              ),
            ];

      const filteredByDate = filteredByType.filter((notification) => {
        const notificationDate = new Date(notification.date);
        notificationDate.setHours(0, 0, 0, 0);
        const selectedWithoutTime = new Date(selectedDateObj);
        selectedWithoutTime.setHours(0, 0, 0, 0);

        return notificationDate.getTime() === selectedWithoutTime.getTime();
      });

      setNotificationsState({
        all: [...active, ...inactive],
        allByDate: filteredByDate,
        active: active,
        inactive: inactive,
      });
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const RenderHeaderView = () => {
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
                  elevation: 10,
                },
              ]}
              onPress={() => setSelectedFilter("all")}
            >
              <Text style={style.filterAllText}>All</Text>
            </Pressable>
            {categories.map((res, index) => {
              const getColor = useNotificationIconColors(
                res.type as NotificationType
              );
              return (
                <Pressable
                  key={index}
                  style={[
                    style.filterBtn,
                    { backgroundColor: getColor.backgroundColor },
                    selectedFilter === res.type && {
                      shadowColor: "gray",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 1,
                      shadowRadius: 15,
                      elevation: 10,
                    },
                  ]}
                  onPress={() =>
                    setSelectedFilter(res.type as NotificationType)
                  }
                >
                  <Image
                    source={res.icon}
                    tintColor={res.type === "gmail" ? undefined : res.color}
                    style={style.filterIcon}
                  />
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => {
              if (notificationsState.allByDate.length > 0) {
                setFullScreenPreview(true);
              }
            }}
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
      <HomeHeader hideGrid={notificationsState.allByDate?.length === 0} />

      <View style={style.homeContainContainer}>
        <Animated.View entering={FadeIn.duration(300)} style={style.wrapper}>
          <Pressable
            onPress={() => setShowDateAndYearModal(true)}
            style={style.dateContainer}
          >
            <Text style={style.todayText}>
              {fromNowText(selectedDateObject)}
            </Text>
            <Text style={style.dateText}>{formatDate(selectedDateObject)}</Text>
          </Pressable>

          <View style={style.statusContainer}>
            <View style={style.statusItem}>
              <View
                style={[style.statusDot, { backgroundColor: colors.green }]}
              />
              <Text style={style.statusText}>
                {notificationsState?.active.length}
              </Text>
            </View>
            <View style={style.statusItem}>
              <View style={[style.statusDot, { backgroundColor: "gray" }]} />
              <Text style={style.statusText}>
                {notificationsState?.inactive.length}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ marginVertical: 5 }}>
          <FlatList
            horizontal
            ref={flatListRef}
            data={daysArray}
            onScrollToIndexFailed={() => {}}
            onLayout={scrollToIndex}
            onContentSizeChange={scrollToIndex}
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

        <RenderHeaderView />

        <View style={{ flex: 1, height }}>
          {isLoading && notificationsState?.allByDate?.length !== 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator color={colors.text} size={"large"} />
            </View>
          ) : notificationsState.allByDate?.length !== 0 ? (
            <Animated.FlatList
              data={notificationsState?.allByDate}
              extraData={notificationsState?.allByDate}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  progressBackgroundColor={colors.background}
                  colors={[colors.text]}
                  onRefresh={onRefresh}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 93 }}
              keyExtractor={(item, index) => index.toString()}
              layout={LinearTransition.stiffness(400)}
              entering={FadeIn.easing(Easing.linear)}
              exiting={FadeOut.easing(Easing.linear)}
              renderItem={({ item }) => (
                <ReminderCard
                  notification={item}
                  onRefreshData={loadNotifications}
                  deleteReminder={deleteReminder}
                />
              )}
            />
          ) : (
            <RenderEmptyView />
          )}
        </View>
      </View>

      <FullScreenPreviewModal
        isVisible={fullScreenPreview}
        notifications={notificationsState?.allByDate}
        onClose={() => setFullScreenPreview(false)}
      />

      <YearMonthPicker
        isVisible={showDateAndYearModal}
        selectedYear={selectedDateObject.getFullYear()}
        selectedMonth={selectedDateObject.getMonth()}
        onConfirm={handleDateChange}
        onCancel={() => setShowDateAndYearModal(false)}
      />
    </SafeAreaView>
  );
};

export default Home;
