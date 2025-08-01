import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ControlButtonProps {
  label: string;
  icon: string;
  color: string;
  gradient: [string, string];
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
  disabled: boolean;
  loading: boolean;
  soft?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  label,
  icon,
  gradient,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  loading,
}) => (
  <TouchableOpacity
    style={[styles.controlButton, disabled && styles.disabledButton]}
    onPress={onPress}
    onPressIn={onPressIn}
    onPressOut={onPressOut}
    disabled={disabled}
    activeOpacity={0.85}
  >
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      {loading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Ionicons name={icon as any} size={26} color="white" style={{ marginRight: 6 }} />
      )}
      <Text style={styles.controlButtonText}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

interface ControlGridProps {
  isLoading: boolean;
  isTracking: boolean;
  isPaused: boolean;
  colors: any;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onPressIn: (key: string) => void;
  onPressOut: (key: string) => void;
}

const ControlGrid: React.FC<ControlGridProps> = ({
  isLoading,
  isTracking,
  isPaused,
  colors,
  onStart,
  onStop,
  onPause,
  onResume,
  onPressIn,
  onPressOut,
}) => (
  <View style={styles.controlGrid}>
    <ControlButton
      label="Start"
      icon="play-circle"
      color={colors.green}
      gradient={[colors.green, colors.lightBlue]}
      onPress={onStart}
      onPressIn={() => onPressIn('start')}
      onPressOut={() => onPressOut('start')}
      disabled={isLoading || isTracking}
      loading={isLoading}
      soft
    />
    <ControlButton
      label="Stop"
      icon="stop-circle"
      color={colors.gmailText}
      gradient={[colors.gmailText, colors.gmailDark]}
      onPress={onStop}
      onPressIn={() => onPressIn('stop')}
      onPressOut={() => onPressOut('stop')}
      disabled={isLoading || !isTracking}
      loading={isLoading}
      soft
    />
    <ControlButton
      label="Pause"
      icon="pause-circle"
      color={colors.yellow}
      gradient={[colors.yellow, colors.grayBackground]}
      onPress={onPause}
      onPressIn={() => onPressIn('pause')}
      onPressOut={() => onPressOut('pause')}
      disabled={isLoading || !isTracking || isPaused}
      loading={isLoading}
      soft
    />
    <ControlButton
      label="Resume"
      icon="play-forward"
      color={colors.blue}
      gradient={[colors.blue, colors.lightBlue]}
      onPress={onResume}
      onPressIn={() => onPressIn('resume')}
      onPressOut={() => onPressOut('resume')}
      disabled={isLoading || !isPaused}
      loading={isLoading}
      soft
    />
  </View>
);

const styles = StyleSheet.create({
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 8,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 18,
    margin: 4,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 8,
  },
  gradientBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    borderRadius: 18,
    gap: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default ControlGrid;
