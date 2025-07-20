import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Reminder {
  id: string;
  title: string;
  message: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface RemindersListProps {
  activeReminders: Reminder[];
  inactiveReminders: Reminder[];
  colors: any;
  onActivate: (id: string) => void;
  onRemove: (id: string) => void;
}

const ReminderCard: React.FC<{
  reminder: Reminder;
  colors: any;
  isActive: boolean;
  onActivate?: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ reminder, colors, isActive, onActivate, onRemove }) => (
  <View
    style={[
      styles.reminderCardShadow,
      {
        backgroundColor: colors.background,
        borderColor: isActive ? colors.blue : colors.grayTitle,
        borderWidth: 1.2,
        shadowColor: isActive ? colors.blue : colors.grayTitle,
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 10,
      },
    ]}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
      <View
        style={[
          styles.headerIconCircle,
          { backgroundColor: isActive ? colors.blue : colors.grayTitle },
        ]}
      >
        <Ionicons name="location" size={22} color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.reminderTitle, { color: colors.text }]} numberOfLines={1}>
          {reminder.title}
        </Text>
        <Text style={[styles.reminderMessage, { color: colors.grayTitle }]} numberOfLines={2}>
          {reminder.message}
        </Text>
      </View>
      <LinearGradient
        colors={
          isActive ? [colors.blue, colors.lightBlue] : [colors.grayTitle, colors.grayBackground]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statusBadge}
      >
        <Text style={styles.statusBadgeText}>{isActive ? 'Active' : 'Inactive'}</Text>
      </LinearGradient>
    </View>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 10,
      }}
    >
      <View style={styles.detailsRow}>
        <Ionicons
          name="location"
          size={15}
          color={colors.text === '#000000' ? colors.primary : colors.white}
        />
        <Text style={[styles.reminderDetailText, { color: colors.grayTitle }]}>
          {reminder.latitude.toFixed(4)}, {reminder.longitude.toFixed(4)}{' '}
        </Text>
        <Ionicons
          name="radio"
          size={15}
          color={colors.text === '#000000' ? colors.primary : colors.white}
          style={{ marginLeft: 8 }}
        />
        <Text style={[styles.reminderDetailText, { color: colors.grayTitle }]}>
          Radius: {reminder.radius}m{' '}
        </Text>
      </View>
      <View style={styles.actionsRow}>
        {!isActive && onActivate && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.blue }]}
            onPress={() => onActivate(reminder.id)}
          >
            <Ionicons name="play-circle" size={16} color="white" />
            <Text style={styles.actionButtonText}>Activate</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.gmailText }]}
          onPress={() => onRemove(reminder.id)}
        >
          <Ionicons name="trash-bin" size={16} color="white" />
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const RemindersList: React.FC<RemindersListProps> = ({
  activeReminders,
  inactiveReminders,
  colors,
  onActivate,
  onRemove,
}) => {
  const hasReminders =
    (activeReminders && activeReminders.length > 0) ||
    (inactiveReminders && inactiveReminders.length > 0);
  return (
    <View style={styles.remindersSection}>
      {hasReminders ? (
        <>
          {activeReminders && activeReminders.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {' '}
                  Active Location Reminders ({activeReminders.length}){' '}
                </Text>
              </View>
              {activeReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  colors={colors}
                  isActive={true}
                  onRemove={onRemove}
                />
              ))}
            </View>
          )}
          {inactiveReminders && inactiveReminders.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={20} color={colors.grayTitle} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {' '}
                  Inactive Location Reminders ({inactiveReminders.length}){' '}
                </Text>
              </View>
              {inactiveReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  colors={colors}
                  isActive={false}
                  onActivate={onActivate}
                  onRemove={onRemove}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="location-outline" size={64} color={colors.grayTitle} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            {' '}
            No Location Reminders{' '}
          </Text>
          <Text style={[styles.emptyStateMessage, { color: colors.grayTitle }]}>
            {' '}
            Add location reminders to get notified when you reach specific locations{' '}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  remindersSection: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  reminderCardShadow: {
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1.2,
    width: '100%',
    overflow: 'hidden',
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  reminderMessage: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 2,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    marginLeft: 8,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  reminderDetailText: {
    fontSize: 12,
    fontWeight: '400',
    marginRight: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 12,
    gap: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 12,
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  emptyStateMessage: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
    opacity: 0.8,
  },
});

export default RemindersList;
