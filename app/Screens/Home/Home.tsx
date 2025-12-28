import FullScreenPreviewModal from '@Components/FullScreenPreviewModal';
import ReminderCard from '@Components/ReminderCard';
import RenderCalenderView from '@Components/RenderCalenderView';
import ServiceManager from '@Components/ServiceManager';
import YearMonthPicker from '@Components/YearMonthPicker';
import TextString from '@Constants/TextString';
import isGridView from '@Hooks/isGridView';
import useCalendar from '@Hooks/useCalendar';
import useNotificationPermission from '@Hooks/useNotificationPermission';
import { default as useDatabase } from '@Hooks/useReminder';
import useThemeColors from '@Hooks/useThemeMode';
import { useIsFocused } from '@react-navigation/native';
import { Notification, NotificationStatus, NotificationType } from '@Types/Interface';
import { fromNowText } from '@Utils/isSameDat';
import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';
import { showMessage } from 'react-native-flash-message';
import Animated, { Easing, FadeIn, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate } from '../AddReminder/ReminderScheduled';
import HomeHeader from './Components/HomeHeader';
import RenderEmptyView from './Components/RenderEmptyView';
import RenderHeaderView from './Components/RenderHeaderView';
import styles from './styles';
import { useContacts } from '@Contexts/ContactProvider';
import { useLocation } from '@Contexts/LocationProvider';
import { useAppContext } from '@Contexts/ThemeProvider';

const Home = () => {
  // ...

  const style = styles();
  const isGrid = isGridView();
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
  const [showServiceManager, setShowServiceManager] = useState(false);

  const [notificationsState, setNotificationsState] = useState<NotificationStatus>({
    all: [] as Notification[],
    allByDate: [] as Notification[],
    active: [] as Notification[],
    inactive: [] as Notification[],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<NotificationType | 'all'>('all');

  const scrollToIndex = async () => {
    const index = daysArray.findIndex((item) => item.formattedDate === selectedDate);

    if (flatListRef.current) {
      if (index >= 0 && index <= daysArray.length) {
        flatListRef.current.scrollToIndex({
          animated: true,
          index,
          viewPosition: 0.5,
        });
      }
    }
  };

  useLayoutEffect(() => {
    scrollToIndex();
  }, [selectedDate, isFocus, notificationsState, flatListRef.current]);

  const {
    requestPermission: requestContactPermission,
    syncContacts,
    permissionStatus: contactPermissionStatus,
    hasCheckedPermission: hasCheckedContactPermission,
  } = useContacts();

  const {
    requestPermission: requestLocationPermission,
    refreshLocation,
    permissionStatus: locationPermissionStatus,
    hasCheckedPermission: hasCheckedLocationPermission,
  } = useLocation();

  const hasRequestedPermissionsRef = React.useRef(false);

  useEffect(() => {
    if (!isFocus) return;

    setIsLoading(notificationsState?.allByDate?.length === 0);
    loadNotifications();

    if (permissionStatus !== 'granted') {
      requestPermission();
    }
  }, [isFocus, selectedDate, selectedFilter, permissionStatus]);

  useEffect(() => {
    if (!isFocus) return;
    if (!hasCheckedLocationPermission || !hasCheckedContactPermission) return;
    if (hasRequestedPermissionsRef.current) return;

    const requestAllPermissions = async () => {
      hasRequestedPermissionsRef.current = true;

      if (locationPermissionStatus === 'granted') {
        refreshLocation(true);
      } else if (locationPermissionStatus !== 'blocked') {
        const locationStatus = await requestLocationPermission();
        if (locationStatus === 'granted') {
          refreshLocation(true);
        }
      }

      if (contactPermissionStatus === 'granted') {
        syncContacts();
      } else if (contactPermissionStatus !== 'blocked') {
        const contactStatus = await requestContactPermission();
        if (contactStatus === 'granted') {
          syncContacts();
        }
      }
    };

    requestAllPermissions();
  }, [
    isFocus,
    hasCheckedLocationPermission,
    hasCheckedContactPermission,
    locationPermissionStatus,
    contactPermissionStatus,
  ]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadNotifications();
      setRefreshing(false);
    } catch (error) {
      setRefreshing(false);
    }
  }, [selectedDate, selectedFilter]);

  const loadNotifications = async () => {
    try {
      const allNotifications = await getAllNotifications();

      const now = new Date();

      // For location-based reminders, they are "active" unless status is 'sent'
      // For time-based reminders, they are "active" if date is in future
      const active = allNotifications
        .filter((notification) => {
          if (notification.type === 'location') {
            // Location reminders are active unless status is 'sent'
            return notification.status !== 'sent';
          }
          // Time-based reminders are active if date is in the future
          return new Date(notification.date).getTime() >= now.getTime();
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const inactive = allNotifications
        .filter((notification) => {
          if (notification.type === 'location') {
            // Location reminders are inactive only when status is 'sent'
            return notification.status === 'sent';
          }
          // Time-based reminders are inactive if date is in the past
          return new Date(notification.date).getTime() < now.getTime();
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const [day, month, year] = selectedDate.split('-');
      // Construct date using numeric component to ensure Local Midnight (consistent with useCalendar)
      const selectedDateObj = new Date(Number(year), Number(month) - 1, Number(day));

      if (isNaN(selectedDateObj.getTime())) {
        console.error('Invalid selectedDate:', selectedDate);
        showMessage({
          message: `Invalid selected date: ${selectedDate?.toString()}`,
          type: 'danger',
        });
        return;
      }

      const filteredByType =
        selectedFilter === 'all'
          ? [...active, ...inactive]
          : [
              ...active.filter((notification) => notification.type === selectedFilter),
              ...inactive.filter((notification) => notification.type === selectedFilter),
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
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReminder = useCallback(async (id?: string) => {
    if (!id) {
      showMessage({
        message: 'Invalid reminder ID',
        type: 'danger',
      });
      return;
    }

    Alert.alert(
      'Confirmation',
      `Are you sure you want to delete this event? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            await deleteNotification(id);
            loadNotifications();
          },
        },
      ],
    );
  }, []);

  const handleDateChange = (year: number, month: number) => {
    const currentDay = selectedDateObject.getDate();

    const newDate = new Date(year, month - 1, currentDay);

    const formattedDate = newDate.toLocaleDateString('en-GB').replace(/\//g, '-');

    setSelectedDate(formattedDate);
    setSelectedDateObject(newDate);
    setCurrentMonth(newDate);
    setShowDateAndYearModal(false);
  };

  return (
    <SafeAreaView style={style.container}>
      <HomeHeader
        title={TextString.DailySync}
        titleAlignment="center"
        leftIconType="grid"
        onServicePress={() => setShowServiceManager(true)}
      />

      <View style={style.homeContainContainer}>
        <Animated.View entering={FadeIn.duration(300)} style={style.wrapper}>
          <Pressable onPress={() => setShowDateAndYearModal(true)} style={style.dateContainer}>
            <Text style={style.todayText}>{fromNowText(selectedDateObject)}</Text>
            <Text style={style.dateText}>{formatDate(selectedDateObject)}</Text>
          </Pressable>

          <View style={style.statusContainer}>
            <View style={style.statusItem}>
              <View style={[style.statusDot, { backgroundColor: colors.green }]} />
              <AnimatedRollingNumber
                value={notificationsState?.active.length}
                enableCompactNotation
                compactToFixed={2}
                key={notificationsState?.active.length + theme?.toString()}
                textStyle={style.statusText}
                numberStyle={style.statusText}
                spinningAnimationConfig={{ duration: 500, easing: Easing.bounce }}
              />
            </View>
            <View style={style.statusItem}>
              <View style={[style.statusDot, { backgroundColor: 'gray' }]} />
              <AnimatedRollingNumber
                value={notificationsState?.inactive.length}
                enableCompactNotation
                compactToFixed={2}
                key={notificationsState?.inactive.length + theme?.toString()}
                textStyle={style.statusText}
                spinningAnimationConfig={{ duration: 500, easing: Easing.bounce }}
              />
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
            contentContainerStyle={{ gap: 15 }}
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
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </Animated.View>

        <RenderHeaderView
          selectedFilter={selectedFilter}
          notificationsState={notificationsState}
          setSelectedFilter={setSelectedFilter}
          setFullScreenPreview={setFullScreenPreview}
        />

        <View style={{ flex: 1, height }}>
          {isLoading && notificationsState?.allByDate?.length !== 0 ? (
            <View style={style.loaderContainer}>
              <ActivityIndicator color={colors.text} size={'large'} />
            </View>
          ) : notificationsState.allByDate?.length !== 0 ? (
            <Animated.FlatList
              layout={LinearTransition}
              itemLayoutAnimation={LinearTransition.springify()}
              columnWrapperStyle={isGrid ? { justifyContent: 'space-between' } : undefined}
              key={isGrid ? 'grid' : 'list'}
              numColumns={isGrid ? 2 : undefined}
              data={notificationsState?.allByDate}
              extraData={notificationsState?.allByDate}
              refreshControl={
                <RefreshControl
                  onRefresh={onRefresh}
                  colors={[colors.text]}
                  refreshing={refreshing}
                  progressBackgroundColor={colors.background}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 93 }}
              keyExtractor={(item) => item?.id?.toString()}
              renderItem={({ item }) => (
                <ReminderCard
                  notification={item}
                  onRefreshData={loadNotifications}
                  deleteReminder={deleteReminder}
                />
              )}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
            />
          ) : (
            <View style={{ height: '80%' }}>
              <RenderEmptyView />
            </View>
          )}
        </View>

        <FullScreenPreviewModal
          isVisible={fullScreenPreview}
          notifications={notificationsState?.allByDate}
          onClose={() => setFullScreenPreview(false)}
          onRefreshData={loadNotifications}
          setFullScreenPreview={setFullScreenPreview}
        />

        <YearMonthPicker
          isVisible={showDateAndYearModal}
          selectedYear={selectedDateObject.getFullYear()}
          selectedMonth={selectedDateObject.getMonth()}
          onConfirm={handleDateChange}
          onCancel={() => setShowDateAndYearModal(false)}
        />

        {/* <BatteryOptimizationModal
          visible={showBatteryModal}
          onConfirm={batteryModalConfirmRef.current}
          onCancel={() => setShowBatteryModal(false)}
        /> */}

        <ServiceManager
          isVisible={showServiceManager}
          onClose={() => setShowServiceManager(false)}
        />
      </View>
    </SafeAreaView>
  );
};

export default memo(Home);
