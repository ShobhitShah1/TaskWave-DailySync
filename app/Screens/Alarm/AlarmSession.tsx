import AssetsPath from '@Constants/AssetsPath';
import TextString from '@Constants/TextString';
import { FONTS, SIZE } from '@Constants/Theme';
import {
  useAddOwnerVoiceNote,
  useAlarmFeed,
  useAlarmSession,
  useDeleteOwnerVoiceNote,
} from '@Hooks/useAlarm';
import { useAudioQueue } from '@Hooks/useAudioQueue';
import { useCountdownTimer } from '@Hooks/useCountdownTimer';
import useThemeColors from '@Hooks/useThemeMode';
import { useVoiceRecorder } from '@Hooks/useVoiceRecorder';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HomeHeader from '@Screens/Home/Components/HomeHeader';
import { RootStackParamList } from '@Types/Interface';
import { dismissAlarmNotifications } from '@Utils/dismissAlarmNotifications';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaView } from 'react-native-safe-area-context';

type AlarmSessionRoute = RouteProp<RootStackParamList, 'AlarmSession'>;

interface AlarmSessionViewProps {
  alarmId: string;
  notificationId?: string;
  onBack: () => void;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const formatTime = (value: string) =>
  new Date(value)
    .toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })
    .toLowerCase();

const formatAudioDuration = (value: number) => {
  const totalSeconds = Math.max(0, Math.floor(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const AudioProgress: React.FC<{
  color: string;
  durationMillis: number;
  loading: boolean;
  positionMillis: number;
  textColor: string;
}> = ({ color, durationMillis, loading, positionMillis, textColor }) => {
  const progress = durationMillis ? Math.min(1, Math.max(0, positionMillis / durationMillis)) : 0;

  return (
    <View style={styles.audioProgressContent}>
      <View style={styles.audioProgressTrack}>
        <View
          style={[
            styles.audioProgressFill,
            {
              backgroundColor: color,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>
      <View style={styles.audioProgressFooter}>
        {loading ? (
          <View style={styles.audioLoadingRow}>
            <View style={[styles.audioLoadingDot, { backgroundColor: color }]} />
            <View style={[styles.audioLoadingDot, { backgroundColor: color, opacity: 0.65 }]} />
            <View style={[styles.audioLoadingDot, { backgroundColor: color, opacity: 0.35 }]} />
            <Text style={[styles.audioLoadingText, { color: textColor }]}>Loading audio</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.audioTime, { color: textColor }]}>
              {formatAudioDuration(positionMillis)}
            </Text>
            <Text style={[styles.audioTime, { color: textColor }]}>
              {formatAudioDuration(durationMillis)}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

export const AlarmSessionView: React.FC<AlarmSessionViewProps> = ({
  alarmId,
  notificationId,
  onBack,
}) => {
  const colors = useThemeColors();
  const sessionQuery = useAlarmSession(alarmId);
  const { groupQuery } = useAlarmFeed();
  const sendNoteMutation = useAddOwnerVoiceNote(alarmId);
  const deleteNoteMutation = useDeleteOwnerVoiceNote(alarmId);
  const recorder = useVoiceRecorder();
  const [recordingMemberId, setRecordingMemberId] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const session = sessionQuery.data;
  const responseMembers = useMemo(
    () => session?.members.filter((member) => Boolean(member.responseMemoUri)) || [],
    [session?.members],
  );
  const responseUris = useMemo(
    () => responseMembers.map((member) => member.responseMemoUri as string),
    [responseMembers],
  );
  const player = useAudioQueue(responseUris, { autoAdvance: false, autoPlay: false });
  const ownerNoteUris = useMemo(
    () => session?.ownerVoiceNotes.map((note) => note.uri) || [],
    [session?.ownerVoiceNotes],
  );
  const ownerNotePlayer = useAudioQueue(ownerNoteUris, { autoAdvance: false, autoPlay: false });
  const feedAlarm = groupQuery.data?.alarms.find((alarm) => alarm.id === alarmId);
  const scheduledFor = feedAlarm?.nextTriggerAt || session?.scheduledFor;
  const countdown = useCountdownTimer(scheduledFor);

  useFocusEffect(
    useCallback(() => {
      dismissAlarmNotifications(alarmId, notificationId).catch(() => undefined);
    }, [alarmId, notificationId]),
  );

  const handleMemberMicPress = async (memberId: string, canSendVoiceNote: boolean) => {
    if (sendNoteMutation.isPending) {
      return;
    }

    if (!canSendVoiceNote) {
      showMessage({
        message: 'This member is already awake. You cannot send more voice notes.',
        type: 'warning',
      });
      return;
    }

    if (recorder.isRecording && recordingMemberId !== memberId) {
      showMessage({
        message: 'Finish the current recording before selecting another member.',
        type: 'warning',
      });
      return;
    }

    try {
      await Promise.all([player.stop(), ownerNotePlayer.stop()]);
      if (!recorder.isRecording) {
        setRecordingMemberId(memberId);
        await recorder.startRecording();
        return;
      }

      const uri = await recorder.stopRecording();
      if (!uri) {
        throw new Error('The voice note could not be saved.');
      }

      await sendNoteMutation.mutateAsync({ uri, recipientUserId: memberId });
      recorder.resetRecording();
      setRecordingMemberId(null);
      showMessage({ message: 'Voice note sent.', type: 'success' });
    } catch (error) {
      setRecordingMemberId(null);
      showMessage({
        message: error instanceof Error ? error.message : 'Unable to send voice note.',
        type: 'danger',
      });
    }
  };

  const handleOwnerNotePress = async (noteId: string) => {
    const noteIndex = session?.ownerVoiceNotes.findIndex((note) => note.id === noteId) ?? -1;
    if (noteIndex < 0) {
      return;
    }

    await player.stop();
    if (ownerNotePlayer.currentIndex === noteIndex) {
      await ownerNotePlayer.toggle();
    } else {
      await ownerNotePlayer.playAt(noteIndex);
    }
  };

  const handleDeleteOwnerNote = (noteId: string) => {
    if (deleteNoteMutation.isPending) {
      return;
    }

    Alert.alert('Delete Voice Note', 'Delete this voice note for the invited member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await ownerNotePlayer.stop();
            await deleteNoteMutation.mutateAsync(noteId);
            showMessage({ message: 'Voice note deleted.', type: 'success' });
          } catch (error) {
            showMessage({
              message: error instanceof Error ? error.message : 'Unable to delete voice note.',
              type: 'danger',
            });
          }
        },
      },
    ]);
  };

  if (sessionQuery.isLoading && !session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader
          title={TextString.DailySync}
          titleAlignment="center"
          leftIconType="back"
          onBackPress={onBack}
          showThemeSwitch={false}
        />
        <ActivityIndicator style={styles.loader} size="large" color={colors.alarmFocus} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader
          title={TextString.DailySync}
          titleAlignment="center"
          leftIconType="back"
          onBackPress={onBack}
          showThemeSwitch={false}
        />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Alarm session unavailable</Text>
          <Pressable onPress={() => sessionQuery.refetch()}>
            <Text style={[styles.retryText, { color: colors.alarmFocus }]}>Refresh</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const activeResponseMember =
    player.currentIndex >= 0 ? responseMembers[player.currentIndex] : undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <HomeHeader
        title={TextString.DailySync}
        titleAlignment="center"
        leftIconType="back"
        onBackPress={onBack}
        showThemeSwitch={false}
      />

      <ScrollView
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={sessionQuery.isRefetching}
            onRefresh={sessionQuery.refetch}
            tintColor={colors.alarmFocus}
            colors={[colors.alarmFocus]}
          />
        }
      >
        <View style={styles.countdownRow}>
          {countdown.formattedTimeLeft.split(' : ').map((part, index) => {
            const [value, unit] = part.match(/^(\d+)(.*)$/)?.slice(1) || [part, ''];
            return (
              <React.Fragment key={`${part}-${index}`}>
                {index > 0 ? (
                  <Text style={[styles.countdownSeparator, { color: colors.alarmFocus }]}>:</Text>
                ) : null}
                <Text style={[styles.countdownValue, { color: colors.alarmFocus }]}>
                  {value}
                  <Text style={[styles.countdownUnit, { color: colors.text }]}>{unit}</Text>
                </Text>
              </React.Fragment>
            );
          })}
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.text }]}>
            {formatDate(scheduledFor || session.scheduledFor)}
          </Text>
          <Text style={[styles.metaText, { color: colors.text }]}>
            {formatTime(scheduledFor || session.scheduledFor)}
          </Text>
        </View>

        <View style={[styles.memberPanel, { backgroundColor: colors.previewBackground }]}>
          {session.members.map((member) => {
            const isAccepted = member.inviteStatus === 'accepted';
            const responseIndex = responseMembers.findIndex(
              (responseMember) => responseMember.userId === member.userId,
            );
            const hasResponse = responseIndex >= 0;
            const responseIsActive = player.currentIndex === responseIndex;
            const isPlaying = activeResponseMember?.userId === member.userId && player.isPlaying;
            const sentCount = session.ownerVoiceNotes.filter(
              (note) => note.recipientUserId === member.userId,
            ).length;
            const sentNotes = session.ownerVoiceNotes.filter(
              (note) => note.recipientUserId === member.userId,
            );
            const isRecording = recorder.isRecording && recordingMemberId === member.userId;
            const isExpanded = expandedMemberId === member.userId && sentNotes.length > 0;
            const canSendVoiceNote = isAccepted && !member.responseMemoUri;

            return (
              <View
                key={member.userId}
                style={[styles.memberCard, { backgroundColor: colors.alarmActiveCardBackground }]}
              >
                <View style={styles.memberRow}>
                  <Pressable
                    disabled={!sentNotes.length}
                    onPress={() =>
                      setExpandedMemberId((current) =>
                        current === member.userId ? null : member.userId,
                      )
                    }
                    style={styles.memberNameButton}
                  >
                    <Text numberOfLines={1} style={[styles.memberName, { color: colors.text }]}>
                      {member.fullName}
                    </Text>
                    {sentNotes.length ? (
                      <Text style={[styles.expandText, { color: colors.placeholderText }]}>
                        {isExpanded ? 'Hide' : 'Notes'}
                      </Text>
                    ) : null}
                  </Pressable>

                  {isAccepted ? (
                    <>
                      <Image
                        source={
                          member.responseMemoUri ? AssetsPath.ic_wakeup : AssetsPath.ic_sleeping
                        }
                        style={styles.statusIcon}
                        resizeMode="contain"
                      />

                      <Pressable
                        disabled={!hasResponse}
                        onPress={async () => {
                          await ownerNotePlayer.stop();
                          if (player.currentIndex === responseIndex) {
                            await player.toggle();
                          } else {
                            await player.playAt(responseIndex);
                          }
                        }}
                        style={[styles.actionButton, !hasResponse && styles.disabledAction]}
                      >
                        <Image
                          source={isPlaying ? AssetsPath.ic_pause : AssetsPath.ic_play}
                          style={styles.playIcon}
                          tintColor={colors.text}
                          resizeMode="contain"
                        />
                      </Pressable>

                      <Pressable
                        disabled={!canSendVoiceNote}
                        onPress={() => handleMemberMicPress(member.userId, canSendVoiceNote)}
                        style={[
                          styles.micButton,
                          isRecording && styles.recordingMic,
                          !canSendVoiceNote && styles.disabledAction,
                        ]}
                      >
                        <Image
                          source={AssetsPath.ic_alarm_mic}
                          style={styles.micIcon}
                          tintColor={
                            !canSendVoiceNote
                              ? colors.placeholderText
                              : isRecording
                                ? '#FF3B30'
                                : colors.text
                          }
                          resizeMode="contain"
                        />
                        {sentCount > 0 ? (
                          <View style={styles.sentBadge}>
                            <Text style={styles.sentBadgeText}>{sentCount}</Text>
                          </View>
                        ) : null}
                      </Pressable>
                    </>
                  ) : (
                    <View style={styles.requestStatus}>
                      <Text style={[styles.requestStatusText, { color: colors.placeholderText }]}>
                        {member.inviteStatus === 'pending' ? 'Requested' : 'Declined'}
                      </Text>
                    </View>
                  )}
                </View>

                {hasResponse ? (
                  <View style={styles.memberAudioProgress}>
                    <AudioProgress
                      color={colors.alarmFocus}
                      durationMillis={
                        responseIsActive
                          ? player.durationMillis || player.durationsMillis[responseIndex] || 0
                          : player.durationsMillis[responseIndex] || 0
                      }
                      loading={player.durationLoading[responseIndex] ?? true}
                      positionMillis={responseIsActive ? player.positionMillis : 0}
                      textColor={colors.placeholderText}
                    />
                  </View>
                ) : null}

                {isExpanded ? (
                  <View style={[styles.sentNotes, { borderTopColor: colors.borderColor }]}>
                    {sentNotes.map((note, index) => {
                      const noteIndex = session.ownerVoiceNotes.findIndex(
                        (ownerNote) => ownerNote.id === note.id,
                      );
                      const noteIsPlaying =
                        ownerNotePlayer.currentIndex === noteIndex && ownerNotePlayer.isPlaying;
                      const noteIsActive = ownerNotePlayer.currentIndex === noteIndex;

                      return (
                        <View key={note.id}>
                          <View
                            style={[
                              styles.sentNoteRow,
                              { backgroundColor: colors.previewBackground },
                            ]}
                          >
                            <Text style={[styles.sentNoteLabel, { color: colors.text }]}>
                              Voice Note {String(index + 1).padStart(2, '0')}
                            </Text>
                            <Pressable
                              onPress={() => handleOwnerNotePress(note.id)}
                              style={styles.sentNoteAction}
                            >
                              <Image
                                source={noteIsPlaying ? AssetsPath.ic_pause : AssetsPath.ic_play}
                                style={styles.sentNoteIcon}
                                tintColor={colors.text}
                              />
                            </Pressable>
                            <Pressable
                              disabled={deleteNoteMutation.isPending}
                              onPress={() => handleDeleteOwnerNote(note.id)}
                              style={styles.sentNoteAction}
                            >
                              <Image
                                source={AssetsPath.ic_delete}
                                style={styles.sentNoteIcon}
                                tintColor="#FF3B30"
                              />
                            </Pressable>
                          </View>
                          <View style={styles.sentNoteProgress}>
                            <AudioProgress
                              color={colors.alarmFocus}
                              durationMillis={
                                noteIsActive
                                  ? ownerNotePlayer.durationMillis ||
                                    ownerNotePlayer.durationsMillis[noteIndex] ||
                                    0
                                  : ownerNotePlayer.durationsMillis[noteIndex] || 0
                              }
                              loading={ownerNotePlayer.durationLoading[noteIndex] ?? true}
                              positionMillis={noteIsActive ? ownerNotePlayer.positionMillis : 0}
                              textColor={colors.placeholderText}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const AlarmSessionScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<AlarmSessionRoute>();

  return (
    <AlarmSessionView
      alarmId={params.alarmId}
      notificationId={params.notificationId}
      onBack={() => navigation.goBack()}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
  },
  content: {
    width: SIZE.appContainWidth,
    flexGrow: 1,
    alignSelf: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: 34,
    fontFamily: FONTS.Medium,
  },
  countdownUnit: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
  },
  countdownSeparator: {
    marginHorizontal: 8,
    fontSize: 31,
    fontFamily: FONTS.Medium,
  },
  metaRow: {
    marginTop: 24,
    marginBottom: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
  },
  memberPanel: {
    flex: 1,
    minHeight: 430,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  memberCard: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  memberRow: {
    minHeight: 66,
    paddingLeft: 18,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberNameButton: {
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 18,
    fontFamily: FONTS.Medium,
  },
  expandText: {
    marginTop: 1,
    fontSize: 11,
    fontFamily: FONTS.Medium,
  },
  statusIcon: {
    width: 40,
    height: 40,
    marginHorizontal: 10,
  },
  actionButton: {
    width: 36,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 18,
    height: 18,
  },
  micButton: {
    width: 40,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
  },
  recordingMic: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  micIcon: {
    width: 24,
    height: 31,
  },
  sentBadge: {
    position: 'absolute',
    right: 0,
    top: 1,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
  },
  sentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.SemiBold,
  },
  disabledAction: {
    opacity: 0.3,
  },
  sentNotes: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 7,
  },
  sentNoteRow: {
    height: 42,
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentNoteLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.Medium,
  },
  sentNoteAction: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentNoteIcon: {
    width: 17,
    height: 17,
    resizeMode: 'contain',
  },
  memberAudioProgress: {
    paddingBottom: 8,
    paddingHorizontal: 18,
  },
  sentNoteProgress: {
    paddingHorizontal: 12,
    paddingTop: 5,
  },
  audioProgressContent: {
    width: '100%',
  },
  audioProgressTrack: {
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 2,
    height: 4,
    overflow: 'hidden',
    width: '100%',
  },
  audioProgressFill: {
    borderRadius: 2,
    height: '100%',
  },
  audioProgressFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  audioLoadingRow: {
    minHeight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
  },
  audioLoadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  audioLoadingText: {
    marginLeft: 4,
    fontFamily: FONTS.Medium,
    fontSize: 9,
  },
  audioTime: {
    fontFamily: FONTS.Medium,
    fontSize: 9,
  },
  requestStatus: {
    minWidth: 86,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(180, 194, 255, 0.12)',
  },
  requestStatusText: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
  },
  retryText: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: FONTS.Medium,
  },
});

export default AlarmSessionScreen;
