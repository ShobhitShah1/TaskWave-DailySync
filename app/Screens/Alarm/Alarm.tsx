import { FONTS } from '@Constants/Theme';
import {
  useAlarmFeed,
  useDeleteAlarm,
  useLeaveAlarm,
  useRespondToAlarmInvitation,
} from '@Hooks/useAlarm';
import { useAuth } from '@Hooks/useAuth';
import useThemeColors from '@Hooks/useThemeMode';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlarmFilter, GroupAlarmRecord, SoloAlarmRecord } from '@Types/Alarm';
import { RootStackParamList } from '@Types/Interface';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  NativeModules,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import TextString from '@Constants/TextString';
import HomeHeader from '@Screens/Home/Components/HomeHeader';
import AlarmCard from './Components/AlarmCard';
import AlarmInvitationCard from './Components/AlarmInvitationCard';

const FILTERS: { key: AlarmFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'invites', label: 'Invites' },
  { key: 'current', label: 'Current' },
  { key: 'snooze', label: 'Snooze' },
  { key: 'upcoming', label: 'Up coming' },
];

const Alarm = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedFilter, setSelectedFilter] = useState<AlarmFilter>('all');

  const { soloQuery, groupQuery } = useAlarmFeed();
  const respondMutation = useRespondToAlarmInvitation();
  const deleteMutation = useDeleteAlarm();
  const leaveMutation = useLeaveAlarm();
  const { auth } = useAuth();

  const handleRefresh = useCallback(() => {
    try {
      soloQuery.refetch();
      groupQuery.refetch();
    } catch (error) {}
  }, [soloQuery, groupQuery]);

  const invitations = groupQuery.data?.invitations || [];

  useFocusEffect(
    useCallback(() => {
      soloQuery.refetch();
      groupQuery.refetch();
    }, []),
  );

  const sortedAlarms = useMemo(() => {
    const solo = (soloQuery.data || []).map((alarm) => ({ ...alarm, source: 'solo' as const }));
    const group = (groupQuery.data?.alarms || []).map((alarm) => ({
      ...alarm,
      source: 'group' as const,
    }));

    const allAlarms = [...solo, ...group];
    const now = Date.now();

    return allAlarms.sort((left, right) => {
      const leftTime = new Date(left.nextTriggerAt).getTime();
      const rightTime = new Date(right.nextTriggerAt).getTime();

      const leftIsPast = leftTime < now || left.status === 'completed';
      const rightIsPast = rightTime < now || right.status === 'completed';

      if (leftIsPast && !rightIsPast) return 1;
      if (!leftIsPast && rightIsPast) return -1;

      return leftTime - rightTime;
    });
  }, [groupQuery.data?.alarms, soloQuery.data]);

  const filteredAlarms = useMemo(() => {
    if (selectedFilter === 'invites') {
      return [];
    }

    const now = Date.now();

    return sortedAlarms.filter((alarm) => {
      const triggerTime = new Date(alarm.nextTriggerAt).getTime();

      switch (selectedFilter) {
        case 'current':
          return Math.abs(triggerTime - now) <= 60 * 60 * 1000;
        case 'snooze':
          return alarm.status === 'snoozed';
        case 'upcoming':
          return triggerTime > now;
        default:
          return true;
      }
    });
  }, [sortedAlarms, selectedFilter]);

  const listData = useMemo(() => {
    const items: any[] = [];

    if (selectedFilter === 'all' || selectedFilter === 'invites') {
      invitations.forEach((inv) => {
        items.push({ ...inv, isInvitation: true });
      });
    }

    if (selectedFilter !== 'invites') {
      filteredAlarms.forEach((alarm) => {
        items.push({ ...alarm, isInvitation: false });
      });
    }

    return items;
  }, [invitations, filteredAlarms, selectedFilter]);

  const handleInvitationAction = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      await respondMutation.mutateAsync({ invitationId, action });
      showMessage({
        message: action === 'accept' ? 'Alarm invitation accepted.' : 'Alarm invitation declined.',
        type: 'success',
      });
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Unable to update invitation.',
        type: 'danger',
      });
    }
  };

  const handleDeleteAlarm = (alarm: SoloAlarmRecord | GroupAlarmRecord) => {
    const isOwner =
      alarm.mode === 'solo' || (alarm.mode === 'group' && alarm.ownerUserId === auth?.user?.id);

    if (isOwner) {
      Alert.alert('Delete Alarm', 'Are you sure you want to delete this alarm?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(
              { alarmId: alarm.id, mode: alarm.mode },
              {
                onSuccess: () => {
                  showMessage({
                    message: 'Alarm deleted successfully',
                    type: 'success',
                  });
                },
                onError: (error: any) => {
                  showMessage({
                    message: error?.message || 'Failed to delete alarm',
                    type: 'danger',
                  });
                },
              },
            );
          },
        },
      ]);
    } else if (alarm.mode === 'group') {
      Alert.alert('Leave Alarm', 'Are you sure you want to leave this shared alarm?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveMutation.mutate(alarm.id, {
              onSuccess: () => {
                showMessage({
                  message: 'You have left the alarm',
                  type: 'success',
                });
              },
              onError: (error: any) => {
                showMessage({
                  message: error?.message || 'Failed to leave alarm',
                  type: 'danger',
                });
              },
            });
          },
        },
      ]);
    }
  };

  const isLoading = soloQuery.isLoading || groupQuery.isLoading;

  const renderItem = ({ item }: { item: any }) => {
    if (item.isInvitation) {
      return (
        <View style={styles.invitationWrapper}>
          <AlarmInvitationCard
            invitation={item}
            onAccept={() => handleInvitationAction(item.id, 'accept')}
            onDecline={() => handleInvitationAction(item.id, 'decline')}
          />
        </View>
      );
    }

    const routeParams =
      item.source === 'group'
        ? { alarmId: item.id, mode: 'group' as const }
        : { alarmId: item.id, mode: 'solo' as const };

    const canEdit = item.mode === 'solo' || item.ownerUserId === auth?.user?.id;

    return (
      <AlarmCard
        alarm={item as SoloAlarmRecord | GroupAlarmRecord}
        onPress={() => navigation.navigate('AlarmDetails', routeParams)}
        onLongPress={() => handleDeleteAlarm(item)}
        onEditPress={
          canEdit
            ? () =>
                navigation.navigate('CreateAlarm', {
                  id: item.id,
                  mode: item.source === 'group' ? 'group' : 'solo',
                })
            : undefined
        }
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <HomeHeader title={TextString.DailySync} titleAlignment="center" leftIconType="none" />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10, gap: 10 }}>
        {['default', 'ting_tong', 'tink_tink'].map((tone, i) => (
          <Pressable
            key={tone}
            style={{ padding: 10, backgroundColor: colors.darkBlue, borderRadius: 8 }}
            onPress={() => {
              NativeModules.AlarmLauncher.launch(
                'Test Alarm',
                `Testing tone: ${tone}`,
                `test-${Date.now()}`,
                'solo',
                tone,
                '5',
                '[]',
                '0',
              );
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Test Sound {i + 1}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((filter) => {
          const selected = selectedFilter === filter.key;

          return (
            <Pressable
              key={filter.key}
              onPress={() => setSelectedFilter(filter.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? colors.text : colors.contactBackground,
                },
              ]}
            >
              <Text
                style={[styles.filterText, { color: selected ? colors.background : colors.text }]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={listData}
        extraData={groupQuery?.data}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.id + index?.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          listData.length === 0 && { flexGrow: 1, justifyContent: 'center' },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={soloQuery.isRefetching || groupQuery.isRefetching}
            onRefresh={handleRefresh}
            colors={[colors.darkBlue]}
            tintColor={colors.darkBlue}
          />
        }
        ListHeaderComponent={
          isLoading && !soloQuery.isRefetching && !groupQuery.isRefetching ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.darkBlue} size="large" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {selectedFilter === 'invites' ? 'No invitations' : 'No alarms yet'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.grayTitle }]}>
                {selectedFilter === 'invites'
                  ? 'New group alarm invites will show here.'
                  : 'On the alarm tab, the center plus now opens the alarm create flow.'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  testButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
  },
  filterScroll: {
    maxHeight: 40,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    minWidth: 72,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  invitationWrapper: {
    marginBottom: 15,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: FONTS.SemiBold,
  },
  emptyText: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: FONTS.Medium,
    maxWidth: 260,
  },
});

export default memo(Alarm);
