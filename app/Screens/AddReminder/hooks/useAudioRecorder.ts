import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import { useCallback, useState, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { check, PERMISSIONS, request } from 'react-native-permissions';
import { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Memo } from '@Types/Interface';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const useAudioRecorder = (createViewColor: string) => {
  const [recording, setRecording] = useState<Recording | undefined>();
  const recordingRef = useRef<Recording | undefined>(undefined);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [audioMetering, setAudioMetering] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const metering = useSharedValue(-100);

  const stopRecording = useCallback(async () => {
    const activeRecording = recordingRef.current || recording;

    if (!activeRecording) {
      console.log(
        '[AudioRecorder] stopRecording called but no active recording found in ref or state',
      );
      return;
    }

    try {
      console.log('[AudioRecorder] Stopping recording...');

      // Clear references first to prevent double-calls
      recordingRef.current = undefined;
      setRecording(undefined);

      const status = await activeRecording.getStatusAsync();
      console.log('[AudioRecorder] Current recording status:', status);

      if (status.canRecord || status.isRecording) {
        await activeRecording.stopAndUnloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = activeRecording.getURI();
      console.log('[AudioRecorder] Recording saved at:', uri);

      if (uri) {
        metering.value = -100;
        setMemos((existingMemos) => [{ uri, metering: audioMetering }, ...existingMemos]);
      }
    } catch (err: any) {
      console.error('[AudioRecorder] Failed to stop recording:', err);
      showMessage({
        message: `Failed to save recording: ${err?.message || 'Unknown error'}`,
        type: 'danger',
      });
    }
  }, [recording, audioMetering, metering]);

  const startRecording = useCallback(async () => {
    try {
      if (recordingRef.current) {
        console.log('[AudioRecorder] Safety cleanup: stopping existing recording reference...');
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          console.log(
            '[AudioRecorder] Cleanup of previous recording failed (likely already stopped)',
          );
        }
        recordingRef.current = undefined;
        setRecording(undefined);
      }

      console.log('[AudioRecorder] Starting recording sequence...');
      setAudioMetering([]);

      // 1. Prepare Audio Mode
      console.log('[AudioRecorder] Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });

      // 2. Create Recording
      console.log('[AudioRecorder] Creating recording instance...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.metering !== undefined) {
            metering.value = status.metering;
            setAudioMetering((curVal) => [...curVal, status.metering || -100]);
          }
        },
        100,
      );

      recordingRef.current = newRecording;
      setRecording(newRecording);
      console.log('[AudioRecorder] Recording started successfully');
    } catch (err: any) {
      console.error('[AudioRecorder] Failed to start recording:', err);

      // Intensive cleanup on failure
      recordingRef.current = undefined;
      setRecording(undefined);

      showMessage({
        message: `Recording Failed: ${err?.message || 'Unknown error'}`,
        type: 'danger',
      });
    }
  }, [metering]);

  const handleRecording = useCallback(async () => {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [recording, stopRecording, startRecording]);

  const onRecordingPress = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const isPermissionGranted = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
      console.log('[AudioRecorder] Permission status:', isPermissionGranted);

      if (isPermissionGranted === 'granted') {
        await handleRecording();
        return;
      }

      if (isPermissionGranted === 'denied') {
        const response = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        if (response === 'granted') {
          await handleRecording();
        } else {
          showMessage({
            message: 'Audio recording permission is required. Please grant it in settings.',
            type: 'danger',
            onPress: () => Linking.openSettings(),
          });
        }
        return;
      }

      if (isPermissionGranted === 'blocked' || isPermissionGranted === 'unavailable') {
        showMessage({
          message: 'Audio recording is blocked. Please enable it in system settings.',
          type: 'danger',
          onPress: () => Linking.openSettings(),
        });
        return;
      }

      // Fallback for other statuses
      const response = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
      if (response === 'granted') {
        await handleRecording();
      }
    } catch (err) {
      console.error('[AudioRecorder] Error in onRecordingPress:', err);
      showMessage({
        message: 'Failed to handle recording request.',
        type: 'danger',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, handleRecording]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        console.log('[AudioRecorder] Unmount cleanup: stopping recording...');
        recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
      }
    };
  }, []);

  const animatedRecordWave = useAnimatedStyle(() => {
    const size = withTiming(
      recording ? interpolate(metering.value, [-160, -60, 0], [0, 0, -30]) : 0,
      { duration: 300 },
    );

    const opacity = withTiming(recording ? 1 : 0, { duration: 300 });

    return {
      top: size,
      bottom: size,
      left: size,
      right: size,
      backgroundColor: `rgba(${createViewColor}, ${interpolate(
        metering.value,
        [-160, -60, -10],
        [0.7, 0.3, 0.7],
      )})`,
      opacity,
    };
  });

  return {
    recording,
    setRecording,
    memos,
    setMemos,
    audioMetering,
    setAudioMetering,
    metering,
    onRecordingPress,
    handleRecording,
    startRecording,
    stopRecording,
    animatedRecordWave,
  };
};

export default useAudioRecorder;
