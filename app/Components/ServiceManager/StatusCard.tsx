import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FONTS } from '@Constants/Theme';

interface StatusCardProps {
  status: string;
  colors: Record<string, string>;
  dotScale: any;
  debugInfo?: string;
  showDebug?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const getStatusAccent = (status: string, colors: Record<string, string>) => {
  switch (status) {
    case 'running':
      return colors.green;
    case 'paused':
      return colors.yellow;
    case 'stopped':
      return colors.gmailText;
    default:
      return colors.primary;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running':
      return 'play-circle';
    case 'paused':
      return 'pause-circle';
    case 'stopped':
      return 'close-circle';
    default:
      return 'help-circle';
  }
};

const StatusCard: React.FC<StatusCardProps> = ({ status, colors, debugInfo, showDebug }) => {
  const accent = getStatusAccent(status, colors);
  const [debugOpen, setDebugOpen] = useState(false);
  return (
    <View style={[styles.statusCard, { backgroundColor: colors.background }]}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.statusContent}>
        <View style={[styles.statusIconCircle, { backgroundColor: accent }]}>
          <Ionicons name={getStatusIcon(status)} size={38} color={colors.white} />
        </View>
        <Text style={[styles.statusText, { color: colors.text, fontFamily: FONTS.Bold }]}>
          {status?.toUpperCase() || 'STOPPED'}
        </Text>
        <Text style={[styles.statusSubtext, { color: colors.text, fontFamily: FONTS.Medium }]}>
          Location Tracking Service
        </Text>
      </View>
      {showDebug && debugInfo && (
        <View style={styles.debugSectionWrapper}>
          <TouchableOpacity
            style={styles.debugToggle}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setDebugOpen((v) => !v);
            }}
          >
            <Ionicons name="bug" size={16} color={colors.white} />
            <Text style={[styles.debugTitle, { color: colors.white, fontFamily: FONTS.SemiBold }]}>
              Debug Info
            </Text>
            <Ionicons
              name={debugOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.white}
            />
          </TouchableOpacity>
          {debugOpen && (
            <View style={[styles.debugSection, { backgroundColor: colors.grayBackground }]}>
              <Text
                style={[styles.debugText, { color: colors.grayTitle, fontFamily: FONTS.Regular }]}
              >
                {debugInfo}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    alignItems: 'center',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 7,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  statusContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: 6,
  },
  statusText: {
    fontSize: 26,
    fontFamily: FONTS.Bold,
    marginBottom: 6,
    letterSpacing: 1.1,
  },
  statusSubtext: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
    opacity: 0.92,
  },
  debugSectionWrapper: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  debugTitle: {
    fontSize: 14,
    fontFamily: FONTS.SemiBold,
    marginLeft: 6,
  },
  debugSection: {
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    fontFamily: FONTS.Regular,
  },
});

export default StatusCard;
