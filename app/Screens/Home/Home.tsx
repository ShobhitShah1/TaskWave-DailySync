import { useIsFocused } from "@react-navigation/native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import FullScreenPreviewModal from "../../Components/FullScreenPreviewModal";
import ReminderCard from "../../Components/ReminderCard";
import AssetsPath from "../../Global/AssetsPath";
import TextString from "../../Global/TextString";
import useCalendar from "../../Hooks/useCalendar";
import useNotificationPermission from "../../Hooks/useNotificationPermission";
import useDatabase from "../../Hooks/useReminder";
import useThemeColors from "../../Theme/useThemeMode";
import { DayItem, Notification } from "../../Types/Interface";
import { fromNowText } from "../../Utils/isSameDat";
import { formatDate } from "../AddReminder/ReminderScheduled";
import HomeHeader from "./Components/HomeHeader";
import styles from "./styles";
import YearMonthPicker from "../../Components/YearMonthPicker";

const Home = () => {
  const style = styles();
  const colors = useThemeColors();
  const isFocus = useIsFocused();
  const { height } = useWindowDimensions();
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const [showDateAndYearModal, setShowDateAndYearModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { getAllNotifications, deleteNotification } = useDatabase();
  const { permissionStatus, requestPermission } = useNotificationPermission();
  const [notificationsState, setNotificationsState] = useState({
    all: [] as Notification[],
    active: [] as Notification[],
    inactive: [] as Notification[],
  });
  const [refreshing, setRefreshing] = React.useState(false);
  const flatListRef = useRef<FlatList>(null);
  const {
    daysArray,
    handleDayClick,
    selectedDate,
    selectedDateObject,
    setSelectedDate,
    setSelectedDateObject,
    setCurrentMonth,
  } = useCalendar(new Date());

  const findSelectedIndex = () => {
    return daysArray.findIndex((item) => item.formattedDate === selectedDate);
  };

  const scrollToIndex = async () => {
    if (flatListRef.current && isFocus) {
      const index = findSelectedIndex();

      if (index >= 0 && index < daysArray.length) {
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (isFocus) {
      loadNotifications();
    }
  }, [isFocus, selectedDate]);

  useEffect(() => {
    if (permissionStatus !== "granted") {
      requestPermission();
    }
  }, [permissionStatus]);

  const RenderCalenderView = memo(
    ({ item, index }: { item: DayItem; index: number }) => {
      const isSelected = item.formattedDate === selectedDate;
      const backgroundColor = isSelected
        ? "rgba(38, 107, 235, 1)"
        : "transparent";

      return (
        <Pressable
          key={index}
          style={style.calenderContainer}
          onPress={() => handleDayClick(item.formattedDate, index)}
        >
          <Text numberOfLines={1} style={style.calenderWeekText}>
            {item.dayOfWeek}
          </Text>
          <View style={[style.calenderDateTextView, { backgroundColor }]}>
            <Text
              numberOfLines={1}
              style={[
                style.calenderDayText,
                { color: isSelected ? colors.white : colors.text },
              ]}
            >
              {item.date}
            </Text>
          </View>
        </Pressable>
      );
    }
  );

  const loadNotifications = async () => {
    setIsLoading(notificationsState?.active?.length === 0);

    try {
      const allNotifications = await getAllNotifications();

      if (allNotifications && allNotifications.length > 0) {
        const now = new Date();

        const active = allNotifications.filter(
          (notification) => new Date(notification.date) >= now
        );
        const inactive = allNotifications.filter(
          (notification) => new Date(notification.date) < now
        );

        const [day, month, year] = selectedDate.split("-");
        const selectedDateObj = new Date(`${year}-${month}-${day}`);

        if (isNaN(selectedDateObj.getTime())) {
          console.error("Invalid selectedDate:", selectedDate);
          return;
        }

        const filteredByDate = active.filter((notification) => {
          const notificationDate = new Date(
            notification.date
          ).toLocaleDateString();
          const selected = selectedDateObj.toLocaleDateString();

          return notificationDate === selected;
        });

        setNotificationsState({
          all: allNotifications.reverse(),
          active: filteredByDate.reverse(),
          inactive: inactive.reverse(),
        });
      } else {
        setNotificationsState({
          all: [],
          active: [],
          inactive: [],
        });
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReminder = useCallback(async (id?: string) => {
    if (!id) {
      Alert.alert("Error", "Invalid reminder ID");
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

  const RenderEmptyView = () => {
    return (
      <Animated.View
        style={[
          style.emptyViewContainer,
          { flexGrow: 1, justifyContent: "center" },
        ]}
      >
        <Image
          style={style.emptyDateTimeImage}
          source={AssetsPath.ic_emptyDateTime}
        />
        <View style={style.emptyTextContainer}>
          <Text style={style.emptyNoEventTitle}>
            {TextString.NoScheduleYet}
          </Text>
          <Text style={style.emptyListText}>
            {TextString.LetsScheduleYourDailyEvents}
          </Text>
        </View>
        <Image
          source={AssetsPath.ic_emptyRocket}
          resizeMode="contain"
          style={style.emptyArrowRocket}
        />
      </Animated.View>
    );
  };

  const RenderHeaderView = () => {
    return (
      <View style={style.listHeaderView}>
        <Text style={style.headerScheduleText}>Schedule</Text>
        <View>
          <View></View>
          <Pressable onPress={() => setFullScreenPreview(true)}>
            <Image
              resizeMode="contain"
              tintColor={colors.text}
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
    <View style={style.container}>
      <HomeHeader hideGrid={notificationsState.active?.length === 0} />

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
              return <RenderCalenderView item={item} index={index} />;
            }}
            keyExtractor={(item, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
          />
        </Animated.View>

        {notificationsState.active?.length !== 0 && <RenderHeaderView />}

        <View style={{ flex: 1, height }}>
          {isLoading && notificationsState?.active?.length !== 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator color={colors.text} size={"large"} />
            </View>
          ) : notificationsState.active?.length !== 0 ? (
            <Animated.FlatList
              data={notificationsState?.active}
              extraData={notificationsState?.active}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  progressBackgroundColor={colors.background}
                  colors={[colors.text]}
                  onRefresh={onRefresh}
                />
              }
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={RenderEmptyView}
              contentContainerStyle={{ paddingBottom: 30 }}
              keyExtractor={(item, index) => index.toString()}
              layout={LinearTransition.easing(Easing.linear)}
              entering={FadeIn.easing(Easing.linear)}
              exiting={FadeOut.easing(Easing.linear)}
              renderItem={({ item }) => (
                <ReminderCard
                  notification={item}
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
        notifications={notificationsState?.active}
        onClose={() => setFullScreenPreview(false)}
      />

      <YearMonthPicker
        isVisible={showDateAndYearModal}
        selectedYear={selectedDateObject.getFullYear()}
        selectedMonth={selectedDateObject.getMonth()}
        onConfirm={handleDateChange}
        onCancel={() => setShowDateAndYearModal(false)}
      />
    </View>
  );
};

export default Home;
