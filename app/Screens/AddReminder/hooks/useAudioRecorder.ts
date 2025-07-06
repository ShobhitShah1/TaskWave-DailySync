import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { check, PERMISSIONS, request } from 'react-native-permissions';
import { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Memo } from '../../../Types/Interface';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const useAudioRecorder = (createViewColor: string, iconColor: string) => {
  const [recording, setRecording] = useState<Recording | undefined>();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [audioMetering, setAudioMetering] = useState<number[]>([]);
  const metering = useSharedValue(-100);

  const onRecordingPress = async () => {
    const isPermissionGranted = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);

    console.log('isPermissionGranted:', isPermissionGranted);

    if (isPermissionGranted === 'denied') {
      request(PERMISSIONS.ANDROID.RECORD_AUDIO).then((response) => {
        if (response === 'granted') {
          onRecordingPress();
          return;
        }
        showMessage({
          message:
            'Permission to record audio is required for audio recording. Please grant permission to continue. Click the here to open the settings.',
          type: 'danger',
          onPress: () => Linking.openSettings(),
        });
        return;
      });
      return;
    }

    if (isPermissionGranted === 'blocked' || isPermissionGranted === 'unavailable') {
      showMessage({
        message:
          'Permission to record audio is required for audio recording. Please grant permission to continue. Click the here to open the settings.',
        type: 'danger',
        onPress: () => Linking.openSettings(),
      });
      return;
    }

    if (isPermissionGranted !== 'granted') {
      request(PERMISSIONS.ANDROID.RECORD_AUDIO).then((response) => {
        if (response === 'granted') {
          handelRecording();
          return;
        }
      });
      return;
    }

    handelRecording();
  };

  const handelRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = useCallback(async () => {
    try {
      setAudioMetering([]);

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100,
      );
      setRecording(recording);

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering) {
          metering.value = status.metering;
          setAudioMetering((curVal) => [...curVal, status.metering || -100]);
        }
      });
    } catch (err: any) {
      showMessage({
        message: String(err?.message || err),
        type: 'danger',
      });
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) {
      return;
    }

    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();

    if (uri) {
      metering.value = -100;
      setMemos((existingMemos) => [{ uri, metering: audioMetering }, ...existingMemos]);
    }
  }, [recording, audioMetering]);

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
    handelRecording,
    startRecording,
    stopRecording,
    animatedRecordWave,
  };
};

export default useAudioRecorder;
