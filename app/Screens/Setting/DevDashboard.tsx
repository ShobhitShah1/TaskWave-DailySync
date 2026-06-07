import { Ionicons } from '@expo/vector-icons';
import notifee, { TriggerNotification } from '@notifee/react-native';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import HomeHeader from '@Screens/Home/Components/HomeHeader';

const NotificationCard = ({
  item,
  colors,
  onCancel,
}: {
  item: TriggerNotification;
  colors: any;
  onCancel: (id: string) => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timestamp = (item.trigger as any).timestamp;
  const date = timestamp ? new Date(timestamp) : null;
  const isSnooze = item.notification.title?.includes('[SNOOZED]');

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const timeStr = date
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const dateStr = date
    ? date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: colors.scheduleReminderCardBackground,
            borderColor: colors.borderColor,
          },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={[styles.kindPill, { backgroundColor: colors.darkBlue + '18' }]}>
            <View style={[styles.kindDot, { backgroundColor: colors.white }]} />
            <Text style={[styles.kindText, { color: colors.white }]}>
              {item.notification.data?.kind?.toString() || 'trigger'}
            </Text>
          </View>

          {isSnooze && (
            <View style={[styles.snoozePill, { backgroundColor: colors.red + '14' }]}>
              <Ionicons name="moon-outline" size={10} color={colors.white} />
              <Text style={[styles.snoozeText, { color: colors.white }]}>Snoozed</Text>
            </View>
          )}

          <View style={{ flex: 1 }} />

          <Pressable
            onPress={() => item.notification.id && onCancel(item.notification.id)}
            style={[styles.trashBtn, { backgroundColor: colors.red + '12' }]}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={15} color={colors.white} />
          </Pressable>
        </View>

        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {item.notification.title?.replace('[SNOOZED]', '').trim() || 'Untitled'}
        </Text>
        <Text style={[styles.cardBody, { color: colors.grayTitle }]} numberOfLines={2}>
          {item.notification.body || 'No content'}
        </Text>

        <View style={[styles.cardFooter, { borderTopColor: colors.borderColor }]}>
          <View style={styles.footerLeft}>
            <Ionicons name="time-outline" size={13} color={colors.darkBlue} />
            <Text style={[styles.footerTime, { color: colors.darkBlue }]}>{timeStr}</Text>
            {dateStr && (
              <Text style={[styles.footerDate, { color: colors.grayTitle }]}>{dateStr}</Text>
            )}
          </View>

          <Text style={[styles.footerMeta, { color: colors.grayTitle }]} numberOfLines={1}>
            {item.notification.data?.tone?.toString() || 'default'} tone
          </Text>
        </View>

        <Text style={[styles.idText, { color: colors.grayTitle }]} numberOfLines={1}>
          {item.notification.id}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const DevDashboard = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<TriggerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const triggers = await notifee.getTriggerNotifications();
      const sorted = triggers.sort((a, b) => {
        const tA = (a.trigger as any).timestamp || 0;
        const tB = (b.trigger as any).timestamp || 0;
        return tA - tB;
      });
      setNotifications(sorted);
    } catch (error) {
      console.error('Error fetching trigger notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const cancelNotification = async (id: string) => {
    await notifee.cancelNotification(id);
    fetchNotifications();
  };

  const cancelAllNotifications = async () => {
    await notifee.cancelTriggerNotifications();
    fetchNotifications();
  };

  const snoozeCount = notifications.filter((n) =>
    n.notification.title?.includes('[SNOOZED]'),
  ).length;
  const regularCount = notifications.length - snoozeCount;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <HomeHeader
        title="Inspector"
        leftIconType="back"
        showThemeSwitch={false}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.darkBlue + '12', borderColor: colors.darkBlue + '30' },
            ]}
          >
            <Text style={[styles.statNumber, { color: colors.white }]}>{regularCount}</Text>
            <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Scheduled</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.red + '10', borderColor: colors.red + '25' },
            ]}
          >
            <Text style={[styles.statNumber, { color: colors.white }]}>{snoozeCount}</Text>
            <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Snoozed</Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.scheduleReminderCardBackground,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Text style={[styles.statNumber, { color: colors.white }]}>{notifications.length}</Text>
            <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Total</Text>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.listHeaderText, { color: colors.grayTitle }]}>TRIGGER QUEUE</Text>
          {notifications.length > 0 && (
            <Pressable onPress={cancelAllNotifications} style={styles.clearAllBtn} hitSlop={8}>
              <Ionicons name="close-circle-outline" size={14} color={colors.red} />
              <Text style={[styles.clearAllText, { color: colors.red }]}>Clear All</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={colors.darkBlue} />
            <Text style={[styles.loadingText, { color: colors.grayTitle }]}>
              Fetching triggers...
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={({ item }) => (
              <NotificationCard item={item} colors={colors} onCancel={cancelNotification} />
            )}
            keyExtractor={(item) => item.notification.id || Math.random().toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.darkBlue}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { borderColor: colors.borderColor }]}>
                  <Ionicons name="notifications-off-outline" size={28} color={colors.grayTitle} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No Triggers Scheduled
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.grayTitle }]}>
                  Trigger notifications will appear here
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontFamily: FONTS.Bold,
    fontSize: 22,
    lineHeight: 26,
  },
  statLabel: {
    fontFamily: FONTS.Medium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderText: {
    fontFamily: FONTS.Bold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearAllText: {
    fontFamily: FONTS.Bold,
    fontSize: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  kindPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  kindDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  kindText: {
    fontFamily: FONTS.Bold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  snoozePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  snoozeText: {
    fontFamily: FONTS.Bold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trashBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: FONTS.Bold,
    fontSize: 16,
    lineHeight: 20,
  },
  cardBody: {
    fontFamily: FONTS.Regular,
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    marginTop: 6,
    paddingTop: 10,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerTime: {
    fontFamily: FONTS.Bold,
    fontSize: 13,
  },
  footerDate: {
    fontFamily: FONTS.Medium,
    fontSize: 12,
  },
  footerMeta: {
    fontFamily: FONTS.Regular,
    fontSize: 11,
  },
  idText: {
    fontFamily: FONTS.Regular,
    fontSize: 10,
    opacity: 0.45,
    letterSpacing: 0.3,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily: FONTS.Medium,
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    marginTop: 80,
    gap: 10,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: FONTS.Bold,
    fontSize: 16,
  },
  emptySubtitle: {
    fontFamily: FONTS.Regular,
    fontSize: 13,
  },
});

export default DevDashboard;
