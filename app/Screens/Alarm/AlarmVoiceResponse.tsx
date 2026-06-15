import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { useAlarmSession, useSubmitMemberVoiceResponse } from '@Hooks/useAlarm';
import { useAudioQueue } from '@Hooks/useAudioQueue';
import useThemeColors from '@Hooks/useThemeMode';
import { useVoiceRecorder } from '@Hooks/useVoiceRecorder';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@Types/Interface';
import { dismissAlarmNotifications } from '@Utils/dismissAlarmNotifications';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import VoiceNoteRow from './Components/VoiceNoteRow';
import VoiceWaveform from './Components/VoiceWaveform';

type AlarmVoiceResponseRoute = RouteProp<RootStackParamList, 'AlarmVoiceResponse'>;

const formatDuration = (durationMillis: number) => {
  const seconds = Math.floor(durationMillis / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(
    2,
    '0',
  )}`;
};

const AlarmVoiceResponseScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<AlarmVoiceResponseRoute>();
  const sessionQuery = useAlarmSession(params.alarmId);
  const submitMutation = useSubmitMemberVoiceResponse(params.alarmId);
  const recorder = useVoiceRecorder();
  const session = sessionQuery.data;
  const ownerVoiceNotes = useMemo(
    () =>
      (session?.ownerVoiceNotes || []).map((note, index) => ({
        id: note.id,
        uri: note.uri,
        label: `Alarm Note_${String(index + 1).padStart(2, '0')}`,
      })),
    [session?.ownerVoiceNotes],
  );
  const queueUris = useMemo(
    () => [
      ...(session?.mainMemoUri ? [session.mainMemoUri] : []),
      ...ownerVoiceNotes.map((item) => item.uri),
    ],
    [ownerVoiceNotes, session?.mainMemoUri],
  );
  const mainMemoOffset = session?.mainMemoUri ? 1 : 0;
  const player = useAudioQueue(queueUris);
  const recordingPlayer = useAudioQueue(
    useMemo(() => (recorder.recordingUri ? [recorder.recordingUri] : []), [recorder.recordingUri]),
  );
  const hasRecording = recorder.isRecording || !!recorder.recordingUri;
  const recordingProgress = recordingPlayer.durationMillis
    ? recordingPlayer.positionMillis / recordingPlayer.durationMillis
    : hasRecording
      ? 1
      : 0;

  useEffect(() => {
    if (session?.currentUserRole === 'owner') {
      navigation.replace('AlarmSession', { alarmId: params.alarmId });
    }
  }, [navigation, params.alarmId, session?.currentUserRole]);

  useFocusEffect(
    useCallback(() => {
      dismissAlarmNotifications(params.alarmId, params.notificationId).catch(() => undefined);

      return () => {
        player.stop().catch(() => undefined);
        recordingPlayer.stop().catch(() => undefined);
      };
    }, [params.alarmId, params.notificationId, player.stop, recordingPlayer.stop]),
  );

  const handleBack = async () => {
    await Promise.all([player.stop(), recordingPlayer.stop()]);
    navigation.goBack();
  };

  const handleRecord = async () => {
    try {
      await Promise.all([player.stop(), recordingPlayer.stop()]);
      await recorder.toggleRecording();
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Unable to record voice response.',
        type: 'danger',
      });
    }
  };

  const handleSend = async () => {
    if (!recorder.recordingUri) {
      showMessage({ message: 'Record your response before sending.', type: 'warning' });
      return;
    }

    try {
      await Promise.all([player.stop(), recordingPlayer.stop()]);
      await submitMutation.mutateAsync(recorder.recordingUri);
      recorder.resetRecording();
      showMessage({ message: 'Voice response sent.', type: 'success' });
      navigation.reset({
        index: 0,
        routes: [{ name: 'BottomTab', params: { screen: 'Alarm' } }],
      });
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Unable to send voice response.',
        type: 'danger',
      });
    }
  };

  const handleRerecord = async () => {
    try {
      await Promise.all([player.stop(), recordingPlayer.stop()]);
      if (recorder.isRecording) {
        await recorder.stopRecording();
      }
      recorder.resetRecording();
      await recorder.startRecording();
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Unable to restart voice recording.',
        type: 'danger',
      });
    }
  };

  const handleRecordingPreview = async () => {
    try {
      await player.stop();
      await recordingPlayer.toggle();
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Unable to play the recorded response.',
        type: 'danger',
      });
    }
  };

  if (sessionQuery.isLoading && !session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={styles.loader} size="large" color={colors.alarmFocus} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Image source={AssetsPath.ic_leftArrow} style={styles.backIcon} tintColor={colors.text} />
        </Pressable>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Voice notes unavailable</Text>
          <Pressable onPress={() => sessionQuery.refetch()}>
            <Text style={[styles.retryText, { color: colors.alarmFocus }]}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Image source={AssetsPath.ic_leftArrow} style={styles.backIcon} tintColor={colors.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.profileWrap}>
          <Image source={AssetsPath.ic_admin} style={styles.adminIcon} />
          <Pressable
            disabled={!session.mainMemoUri}
            onPress={() =>
              player.currentIndex === 0 && session.mainMemoUri ? player.toggle() : player.playAt(0)
            }
            style={[styles.profilePlay, { backgroundColor: colors.white }]}
          >
            <Image
              source={
                player.currentIndex === 0 && player.isPlaying
                  ? AssetsPath.ic_pause
                  : AssetsPath.ic_play
              }
              style={styles.profilePlayIcon}
              tintColor="#303334"
            />
          </Pressable>
        </View>
        {session.mainMemoUri ? (
          (player.durationLoading[0] ?? true) ? (
            <ActivityIndicator
              color={colors.alarmFocus}
              size="small"
              style={styles.mainMemoLoader}
            />
          ) : (
            <Text style={[styles.mainMemoDuration, { color: colors.placeholderText }]}>
              {formatDuration(player.currentIndex === 0 ? player.positionMillis : 0)} /{' '}
              {formatDuration(
                player.currentIndex === 0
                  ? player.durationMillis || player.durationsMillis[0] || 0
                  : player.durationsMillis[0] || 0,
              )}
            </Text>
          )
        ) : null}

        <ScrollView
          style={styles.noteScroller}
          contentContainerStyle={styles.noteList}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {ownerVoiceNotes.length ? (
            ownerVoiceNotes.map((note, index) => {
              const queueIndex = index + mainMemoOffset;
              return (
                <VoiceNoteRow
                  key={note.id}
                  label={note.label}
                  active={player.currentIndex === queueIndex}
                  playing={player.currentIndex === queueIndex && player.isPlaying}
                  durationMillis={
                    player.currentIndex === queueIndex
                      ? player.durationMillis || player.durationsMillis[queueIndex] || 0
                      : player.durationsMillis[queueIndex] || 0
                  }
                  loading={player.durationLoading[queueIndex] ?? true}
                  positionMillis={player.currentIndex === queueIndex ? player.positionMillis : 0}
                  backgroundColor={colors.previewBackground}
                  textColor={colors.text}
                  onPress={() =>
                    player.currentIndex === queueIndex ? player.toggle() : player.playAt(queueIndex)
                  }
                />
              );
            })
          ) : (
            <Text style={[styles.noNotes, { color: colors.placeholderText }]}>
              No follow-up voice notes from the alarm owner.
            </Text>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={[styles.recordingPreview, !hasRecording && styles.hiddenPreview]}>
            <View style={styles.recordingWave}>
              <VoiceWaveform
                color={colors.placeholderText}
                metering={recorder.metering}
                progress={recordingProgress}
              />
            </View>
            <Text style={[styles.timer, { color: colors.text }]}>
              {formatDuration(recorder.durationMillis)}
            </Text>
          </View>

          <View style={styles.recordActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Record voice response again"
              disabled={!hasRecording}
              onPress={handleRerecord}
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.previewBackground },
                !hasRecording && styles.inactiveControl,
              ]}
            >
              <Image source={AssetsPath.ic_rerecord} style={styles.rerecordIcon} />
            </Pressable>
            {recorder.recordingUri ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  recordingPlayer.isPlaying ? 'Pause recorded response' : 'Play recorded response'
                }
                onPress={handleRecordingPreview}
                style={[styles.recordButton, { backgroundColor: colors.alarmFocus }]}
              >
                <Image
                  source={recordingPlayer.isPlaying ? AssetsPath.ic_pause : AssetsPath.ic_play}
                  style={styles.previewPlayIcon}
                  tintColor="#303334"
                />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  recorder.isRecording ? 'Stop recording' : 'Record voice response'
                }
                onPress={handleRecord}
                style={[styles.recordButton, { backgroundColor: '#FF3B3B' }]}
              >
                <Image
                  source={AssetsPath.ic_recordMic}
                  style={styles.recordIcon}
                  tintColor="#FFFFFF"
                />
              </Pressable>
            )}
            <Pressable
              disabled={!recorder.isRecording}
              onPress={() => recorder.stopRecording()}
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.previewBackground },
                !recorder.isRecording && styles.inactiveControl,
              ]}
            >
              <View style={[styles.stopIcon, { backgroundColor: colors.placeholderText }]} />
            </Pressable>
          </View>

          <Pressable
            disabled={!recorder.recordingUri || submitMutation.isPending}
            onPress={handleSend}
            style={[
              styles.sendButton,
              { backgroundColor: colors.darkBlue },
              (!recorder.recordingUri || submitMutation.isPending) && styles.disabled,
            ]}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
  },
  header: {
    width: '92%',
    alignSelf: 'center',
    height: 48,
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  content: {
    width: '92%',
    alignSelf: 'center',
    flex: 1,
    paddingBottom: 14,
  },
  profileWrap: {
    width: 82,
    height: 86,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  adminIcon: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  profilePlay: {
    position: 'absolute',
    right: -1,
    bottom: 7,
    width: 28,
    height: 28,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePlayIcon: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
  },
  mainMemoDuration: {
    fontFamily: FONTS.Medium,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  mainMemoLoader: {
    marginTop: 4,
  },
  noteList: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  noteScroller: {
    flex: 1,
    marginTop: 2,
  },
  noNotes: {
    minHeight: 48,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  footer: {
    flexShrink: 0,
    alignItems: 'center',
    paddingTop: 4,
  },
  recordingPreview: {
    alignItems: 'center',
    height: 74,
    justifyContent: 'flex-end',
  },
  hiddenPreview: {
    opacity: 0,
  },
  recordingWave: {
    width: 242,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 27,
    lineHeight: 32,
    fontFamily: FONTS.SemiBold,
  },
  recordActions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  secondaryButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rerecordIcon: {
    width: 27,
    height: 27,
    resizeMode: 'contain',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  previewPlayIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  stopIcon: {
    width: 17,
    height: 17,
    borderRadius: 2,
  },
  sendButton: {
    width: 128,
    height: 46,
    borderRadius: 23,
    alignSelf: 'center',
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
  disabled: {
    opacity: 0.35,
  },
  inactiveControl: {
    opacity: 0.45,
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

export default AlarmVoiceResponseScreen;
