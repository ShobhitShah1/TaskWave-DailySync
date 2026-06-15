import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import { AlarmInvitation } from '@Types/Alarm';
import { formatAlarmInstantTime } from '@Utils/alarmDisplay';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AlarmInvitationCardProps {
  invitation: AlarmInvitation;
  onAccept: () => void;
  onDecline: () => void;
}

const AlarmInvitationCard: React.FC<AlarmInvitationCardProps> = ({
  invitation,
  onAccept,
  onDecline,
}) => {
  const colors = useThemeColors();
  const scheduledText = formatAlarmInstantTime(invitation.scheduledFor);
  const repeatText =
    invitation.repeat === 'weekly' && invitation.repeatDays.length
      ? invitation.repeatDays.join(', ')
      : invitation.repeat.charAt(0).toUpperCase() + invitation.repeat.slice(1);

  return (
    <View style={[styles.card, { backgroundColor: colors.contactBackground }]}>
      <Text style={[styles.label, { color: colors.alarmFocus }]}>Invitation</Text>
      <Text style={[styles.title, { color: colors.text }]}>{invitation.title}</Text>
      <Text style={[styles.note, { color: colors.grayTitle }]} numberOfLines={2}>
        {invitation.note || 'You were invited to join this group alarm.'}
      </Text>
      <Text style={[styles.meta, { color: colors.grayTitle }]}>
        {`${invitation.inviterName} · ${scheduledText}`}
      </Text>
      <Text style={[styles.subMeta, { color: colors.grayTitle }]}>{repeatText}</Text>

      <View style={styles.actions}>
        <Pressable
          onPress={onDecline}
          style={[styles.secondaryButton, { backgroundColor: colors.grayBackground }]}
        >
          <Text style={[styles.secondaryText, { color: colors.text }]}>Decline</Text>
        </Pressable>

        <Pressable
          onPress={onAccept}
          style={[styles.primaryButton, { backgroundColor: colors.alarmFocus }]}
        >
          <Text style={[styles.primaryText, { color: colors.white }]}>Accept</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
  },
  title: {
    marginTop: 8,
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
  },
  note: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.Medium,
  },
  meta: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: FONTS.Medium,
  },
  subMeta: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FONTS.Medium,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
});

export default AlarmInvitationCard;
