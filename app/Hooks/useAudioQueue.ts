import { authStorage } from '@Utils/authStorage';
import { resolveAlarmAudioUrl } from '@Utils/alarmAudio';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export const useAudioQueue = (uris: string[], autoPlay = false) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const hasAutoPlayedRef = useRef(false);
  const playbackGenerationRef = useRef(0);
  const durationsMillisRef = useRef<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [durationsMillis, setDurationsMillis] = useState<number[]>([]);
  const [durationLoading, setDurationLoading] = useState<boolean[]>([]);

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
      const resolvedUri = resolveAlarmAudioUrl(uris[index]);
      const auth = authStorage.getAuth();
      const headers = auth?.accessToken
        ? { Authorization: `Bearer ${auth.accessToken}` }
        : undefined;
      const generation = playbackGenerationRef.current + 1;
      playbackGenerationRef.current = generation;
      await unload();
      setCurrentIndex(index);
      setPositionMillis(0);
      setDurationMillis(durationsMillisRef.current[index] || 0);

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: resolvedUri, headers },
          { shouldPlay: true, progressUpdateIntervalMillis: 200 },
        );
        if (playbackGenerationRef.current !== generation) {
          await sound.unloadAsync().catch(() => undefined);
          return;
        }
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) {
            if (status.error) {
              setIsPlaying(false);
            }
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
      } catch {
        setIsPlaying(false);
        setCurrentIndex(-1);
      }
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
    let cancelled = false;
    const preloadedSounds = new Set<Audio.Sound>();

    const preloadDurations = async () => {
      const nextDurations = Array.from({ length: uris.length }, () => 0);

      await Promise.all(
        uris.map(async (rawUri, index) => {
          const resolvedUri = resolveAlarmAudioUrl(rawUri);
          const auth = authStorage.getAuth();
          const headers = auth?.accessToken
            ? { Authorization: `Bearer ${auth.accessToken}` }
            : undefined;

          try {
            const { sound, status } = await Audio.Sound.createAsync(
              { uri: resolvedUri, headers },
              { shouldPlay: false },
            );
            preloadedSounds.add(sound);

            if (status.isLoaded) {
              nextDurations[index] = status.durationMillis || 0;
            }

            await sound.unloadAsync().catch(() => undefined);
            preloadedSounds.delete(sound);
          } catch {
            nextDurations[index] = 0;
          } finally {
            if (!cancelled) {
              durationsMillisRef.current[index] = nextDurations[index];
              setDurationsMillis([...durationsMillisRef.current]);
              setDurationLoading((current) =>
                current.map((loading, itemIndex) => (itemIndex === index ? false : loading)),
              );
            }
          }
        }),
      );

      if (!cancelled) {
        durationsMillisRef.current = nextDurations;
        setDurationsMillis(nextDurations);
        setDurationLoading(Array.from({ length: uris.length }, () => false));
      }
    };

    durationsMillisRef.current = Array.from({ length: uris.length }, () => 0);
    setDurationsMillis(durationsMillisRef.current);
    setDurationLoading(Array.from({ length: uris.length }, () => true));

    if (uris.length) {
      preloadDurations().catch(() => undefined);
    }

    return () => {
      cancelled = true;
      preloadedSounds.forEach((sound) => {
        sound.unloadAsync().catch(() => undefined);
      });
      preloadedSounds.clear();
    };
  }, [uris]);

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
    durationsMillis,
    durationLoading,
    playAt,
    toggle,
    stop,
  };
};
