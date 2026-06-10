import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import { useCallback, useEffect, useRef, useState } from 'react';

const RECORDING_OPTIONS = {
  ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

export const useVoiceRecorder = () => {
  const recordingRef = useRef<Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [durationMillis, setDurationMillis] = useState(0);
  const [metering, setMetering] = useState<number[]>([]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) {
      return null;
    }

    recordingRef.current = null;
    stopTimer();
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    // Android can report the URI before the recording file is fully flushed.
    await new Promise((resolve) => setTimeout(resolve, 180));
    setRecordingUri(uri);
    return uri;
  }, [stopTimer]);

  const startRecording = useCallback(async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Microphone permission is required to record a voice note.');
    }

    if (recordingRef.current) {
      await stopRecording();
    }

    setRecordingUri(null);
    setDurationMillis(0);
    setMetering([]);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
    });

    const { recording } = await Audio.Recording.createAsync(
      RECORDING_OPTIONS,
      (status) => {
        if (typeof status.metering === 'number') {
          setMetering((current) => [...current.slice(-79), status.metering as number]);
        }
      },
      100,
    );
    recordingRef.current = recording;
    setIsRecording(true);
    timerRef.current = setInterval(() => {
      setDurationMillis((current) => current + 1000);
    }, 1000);
  }, [stopRecording]);

  const toggleRecording = useCallback(async () => {
    if (recordingRef.current) {
      return stopRecording();
    }
    await startRecording();
    return null;
  }, [startRecording, stopRecording]);

  const resetRecording = useCallback(() => {
    setRecordingUri(null);
    setDurationMillis(0);
    setMetering([]);
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      const recording = recordingRef.current;
      recordingRef.current = null;
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => undefined);
      }
    };
  }, [stopTimer]);

  return {
    isRecording,
    recordingUri,
    durationMillis,
    metering,
    startRecording,
    stopRecording,
    toggleRecording,
    resetRecording,
  };
};
