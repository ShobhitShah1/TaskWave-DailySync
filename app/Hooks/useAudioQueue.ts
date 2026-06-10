import { Audio, AVPlaybackStatus } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export const useAudioQueue = (uris: string[], autoPlay = false) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const hasAutoPlayedRef = useRef(false);
  const playbackGenerationRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);

  const unload = useCallback(async () => {
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) {
      await sound.unloadAsync().catch(() => undefined);
    }
  }, []);

  const stop = useCallback(async () => {
    playbackGenerationRef.current += 1;
    const sound = soundRef.current;
    if (sound) {
      const status = await sound.getStatusAsync().catch(() => null);
      if (status?.isLoaded) {
        await sound.stopAsync().catch(() => undefined);
      }
    }
    await unload();
    setIsPlaying(false);
    setCurrentIndex(-1);
    setPositionMillis(0);
    setDurationMillis(0);
  }, [unload]);

  const playAt = useCallback(
    async (index: number) => {
      if (!uris[index]) {
        return;
      }
      const generation = playbackGenerationRef.current + 1;
      playbackGenerationRef.current = generation;
      await unload();
      setCurrentIndex(index);
      setPositionMillis(0);

      const { sound } = await Audio.Sound.createAsync(
        { uri: uris[index] },
        { shouldPlay: true, progressUpdateIntervalMillis: 200 },
      );
      if (playbackGenerationRef.current !== generation) {
        await sound.unloadAsync().catch(() => undefined);
        return;
      }
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
          return;
        }
        setIsPlaying(status.isPlaying);
        setPositionMillis(status.positionMillis);
        setDurationMillis(status.durationMillis || 0);
        if (status.didJustFinish) {
          const nextIndex = index + 1;
          if (uris[nextIndex]) {
            playAt(nextIndex).catch(() => undefined);
          } else {
            setIsPlaying(false);
          }
        }
      });
    },
    [unload, uris],
  );

  const toggle = useCallback(async () => {
    if (!soundRef.current) {
      if (uris.length) {
        await playAt(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) {
      return;
    }
    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, [currentIndex, playAt, uris.length]);

  useEffect(() => {
    if (autoPlay && uris.length && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      playAt(0).catch(() => undefined);
    }
    return () => {
      unload().catch(() => undefined);
    };
  }, [autoPlay, playAt, unload, uris.length]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        stop().catch(() => undefined);
      }
    });

    return () => subscription.remove();
  }, [stop]);

  return {
    currentIndex,
    isPlaying,
    positionMillis,
    durationMillis,
    playAt,
    toggle,
    stop,
  };
};
