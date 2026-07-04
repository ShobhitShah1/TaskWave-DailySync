import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import useNotificationIconColors from '@Hooks/useNotificationIconColors';
import { useInterstitialAd } from '@Hooks/useInterstitialAd';
import useDatabase, { createNotificationChannel, scheduleNotification } from '@Hooks/useReminder';
import useThemeColors from '@Hooks/useThemeMode';
import { Contact, Notification, NotificationType } from '@Types/Interface';
import { formatNotificationType } from '@Utils/formatNotificationType';
import { validateDateTime } from '@Utils/validateDateTime';
import AddMailSubject from './Components/AddMailSubject';
import AddMailTo from './Components/AddMailTo';
import AddMessage from './Components/AddMessage';
import AddScheduleFrequency from './Components/AddScheduleFrequency';
import AttachFile from './Components/AttachFile';
import AudioRecorder from './Components/AudioRecorder';
import ContactListModal from './Components/ContactListModal';
import ContactSelector from './Components/ContactSelector';
import DateTimePicker from './Components/DateTimePicker';
import Header from './Components/Header';
import useOverlayPermission from '@Hooks/useOverlayPermission';
import OverlayPermissionModal from '@Components/OverlayPermissionModal';
import useAddReminderForm from './hooks/useAddReminderForm';
import useAudioRecorder from './hooks/useAudioRecorder';
import useContactSelector from './hooks/useContactSelector';
import useDateTimePicker from './hooks/useDateTimePicker';
import useDocumentPicker from './hooks/useDocumentPicker';
import useScheduleFrequency from './hooks/useScheduleFrequency';
import styles from './styles';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

type NotificationProps = {
  params: { notificationType: NotificationType; id?: string };
};

const AddReminder = () => {
  const style = styles();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<NotificationProps, 'params'>>();
  const { createNotification, getNotificationById, updateNotification } = useDatabase();
  const { showAd: showInterstitialIfNeeded } = useInterstitialAd();

  const notificationType = useMemo(() => {
    return params.notificationType as NotificationType;
  }, [params]);

  const id = useMemo(() => {
    return params?.id as NotificationType;
  }, [params]);

  useEffect(() => {
    if (id) {
      getExistingNotificationData();
    }
  }, [id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      stopRecording();
    });

    return unsubscribe;
  }, [navigation]);

  const { hasPermission, checkPermission } = useOverlayPermission();
  const [showOverlayModal, setShowOverlayModal] = useState(false);

  const {
    message,
    setMessage,
    to,
    setTo,
    subject,
    setSubject,
    telegramUsername,
    setTelegramUsername,
    validateFields,
  } = useAddReminderForm(notificationType);

  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const { createViewColor, iconColor } = useNotificationIconColors(notificationType);

  const { recording, memos, setMemos, onRecordingPress, stopRecording, animatedRecordWave } =
    useAudioRecorder(createViewColor);

  const {
    contacts,
    selectedContacts,
    setSelectedContacts,
    contactModalVisible,
    setContactModalVisible,
    isContactLoading,
    onHandelContactClick,
    requestContactData,
    handleRemoveContact,
    syncContacts,
  } = useContactSelector();

  const { selectedDocuments, setSelectedDocuments, onHandelAttachmentClick, onRemoveDocument } =
    useDocumentPicker();

  const {
    selectedDateAndTime,
    setSelectedDateAndTime,
    pickerVisibleType,
    setPickerVisibleType,
    handleDatePress,
    handleTimePress,
    handlePickerChange,
  } = useDateTimePicker();

  const { scheduleFrequency, setScheduleFrequency, selectedDays, setSelectedDays } =
    useScheduleFrequency();

  const getExistingNotificationData = async () => {
    const response = await getNotificationById(id);
    if (response) {
      setMessage(response?.message);
      setTo(response?.toMail?.[0]);
      setSubject(response?.subject || '');
      setTelegramUsername(response?.telegramUsername || '');
      setScheduleFrequency(response?.scheduleFrequency);
      setSelectedDays(response?.days);
      setSelectedDateAndTime({
        date: new Date(response?.date),
        time: new Date(response?.date),
      });
      setSelectedDocuments(response?.attachments);
      setSelectedContacts(response?.toContact);
      setMemos(response?.memo || []);
    }
  };

  const handleCreateNotification = async () => {
    if (isLoading || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;

    try {
      // Check overlay permission first
      const permission = await checkPermission();
      if (permission === false) {
        setShowOverlayModal(true);
        return;
      }

      if (validateFields({ selectedContacts, selectedDateAndTime })) {
        setIsLoading(true);

        const selectedDateTime = new Date(
          selectedDateAndTime.date!.getFullYear(),
          selectedDateAndTime.date!.getMonth(),
          selectedDateAndTime.date!.getDate(),
          selectedDateAndTime.time!.getHours(),
          selectedDateAndTime.time!.getMinutes(),
        );

        if (!validateDateTime(selectedDateTime)) {
          throw new Error('The notification must be scheduled at least 10 seconds in the future.');
        }

        await showInterstitialIfNeeded();

        const extractedContacts: Contact[] = selectedContacts?.map((contact) => ({
          name: contact.name,
          number: contact.number || '',
          recordID: contact?.recordID || '',
          thumbnailPath: contact?.thumbnailPath,
        }));

        const notificationData: Notification = {
          id: '',
          type: notificationType,
          message: message.toString() || '',
          date: selectedDateTime,
          subject: notificationType === 'gmail' ? subject : '',
          toContact: extractedContacts,
          toMail: [to],
          attachments: selectedDocuments,
          scheduleFrequency: scheduleFrequency || '',
          days: selectedDays,
          memo: memos || [],
          telegramUsername: telegramUsername?.toString() || '',
        };

        let notificationScheduleId;

        await createNotificationChannel();

        if (id) {
          const updated = await updateNotification({ ...notificationData, id });
          if (updated) {
            notificationScheduleId = id;
          } else {
            showMessage({
              message: 'Failed to update notification.',
              type: 'danger',
            });
            setIsLoading(false);
            return;
          }
        } else {
          notificationScheduleId = await scheduleNotification(notificationData);
          if (notificationScheduleId?.trim()) {
            const data = {
              ...notificationData,
              id: notificationScheduleId,
            };
            const created = await createNotification(data);

            if (!created) {
              showMessage({
                message: String(created),
                type: 'danger',
              });
              setIsLoading(false);
              return;
            }
          } else {
            showMessage({
              message: 'Failed to schedule notification.',
              type: 'danger',
            });
            setIsLoading(false);
            return;
          }
        }

        navigation.navigate('ReminderScheduled', {
          themeColor: createViewColor,
          notification: {
            ...notificationData,
            id: notificationScheduleId,
            date: new Date(notificationData.date).toISOString(),
          },
        });

        setIsLoading(false);
      }
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: 'danger',
      });
      setIsLoading(false);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <>
      <SafeAreaView style={style.container}>
        <View style={style.contentContainer}>
          <Header
            onBackPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            title={formatNotificationType(notificationType)}
            themeColor={createViewColor}
            textColor={colors.text}
            style={style}
          />

          <ScrollView
            style={style.itemsContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
            automaticallyAdjustContentInsets
            automaticallyAdjustsScrollIndicatorInsets
          >
            {notificationType === 'gmail' && (
              <AddMailTo to={to} setTo={setTo} themeColor={createViewColor} />
            )}

            {notificationType === 'gmail' && (
              <AddMailSubject
                subject={subject}
                setSubject={setSubject}
                themeColor={createViewColor}
              />
            )}

            <ContactSelector
              selectedContacts={selectedContacts}
              onHandelContactClick={onHandelContactClick}
              handleRemoveContact={handleRemoveContact}
              themeColor={createViewColor}
              notificationType={notificationType}
              telegramUsername={telegramUsername}
              setTelegramUsername={setTelegramUsername}
            />

            {notificationType !== 'gmail' && (
              <AddMessage
                message={message}
                setMessage={setMessage}
                themeColor={createViewColor}
                title={notificationType === 'phone' ? 'Note' : 'Message'}
              />
            )}

            {notificationType !== 'phone' &&
              notificationType !== 'telegram' &&
              notificationType !== 'note' && (
                <AttachFile
                  themeColor={createViewColor}
                  onRemoveDocument={onRemoveDocument}
                  selectedDocuments={selectedDocuments}
                  onHandelAttachmentClick={onHandelAttachmentClick}
                />
              )}

            {(notificationType === 'whatsapp' || notificationType === 'whatsappBusiness') && (
              <AudioRecorder
                memos={memos}
                setMemos={setMemos}
                recording={recording}
                onRecordingPress={onRecordingPress}
                animatedRecordWave={animatedRecordWave}
                themeColor={createViewColor}
                iconColor={iconColor}
                style={style}
              />
            )}

            <AddScheduleFrequency
              themeColor={createViewColor}
              selectedDays={selectedDays}
              setSelectedDays={setSelectedDays}
              scheduleFrequency={scheduleFrequency}
              setScheduleFrequency={setScheduleFrequency}
            />

            <DateTimePicker
              selectedDateAndTime={selectedDateAndTime}
              handleDatePress={() => {
                Keyboard.dismiss();
                handleDatePress();
              }}
              handleTimePress={() => {
                Keyboard.dismiss();
                handleTimePress();
              }}
              pickerVisibleType={pickerVisibleType}
              handlePickerChange={handlePickerChange}
              themeColor={createViewColor}
              colors={colors}
            />
          </ScrollView>

          <Pressable
            disabled={isLoading}
            onPress={handleCreateNotification}
            style={[style.createButton, { backgroundColor: createViewColor }]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={style.createButtonText}>{id ? 'Update' : 'Create'}</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <ContactListModal
        contacts={contacts}
        isVisible={contactModalVisible}
        onRefreshData={requestContactData}
        selectedContacts={selectedContacts}
        notificationType={notificationType}
        refreshing={isContactLoading.isRefreshing}
        setSelectedContacts={setSelectedContacts}
        isContactLoading={isContactLoading.isLoading}
        onClose={() => setContactModalVisible(false)}
        syncContacts={syncContacts}
        isSyncing={isContactLoading.isRefreshing}
      />

      <OverlayPermissionModal
        isVisible={showOverlayModal}
        onClose={() => setShowOverlayModal(false)}
        autoCheck={false}
      />
    </>
  );
};

export default memo(AddReminder);
