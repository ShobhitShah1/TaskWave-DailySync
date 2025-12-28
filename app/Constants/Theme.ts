import { DimensionValue } from 'react-native';

export const ColorGroups = {
  base: {
    white: 'rgba(255, 255, 255, 1)',
    black: '#000',
    transparent: 'rgba(0, 0, 0, 0)',
  },
  gray: {
    light: 'rgba(21, 22, 22, 0.2)',
    medium: 'rgba(154, 156, 156, 0.6)',
    dark: 'rgba(59, 59, 59, 1)',
    border: 'rgba(173, 175, 176, 0.4)',
    background: 'rgba(241, 241, 240, 1)',
  },
  communication: {
    whatsapp: {
      primary: 'rgba(34, 200, 66, 1)',
      background: 'rgba(34, 200, 66, 0.25)',
      dark: 'rgba(0, 125, 22, 1)',

      business: 'rgba(5, 159, 154, 1)',
      businessBackground: 'rgba(3, 97, 90, 0.15)',
      businessDark: 'rgba(11, 164, 158, 1)',
    },
    sms: {
      primary: 'rgba(0, 151, 236, 1)',
      background: 'rgba(1, 133, 226, 0.2)',
      dark: 'rgba(4, 107, 180, 1)',
    },
    gmail: {
      primary: 'rgba(255, 248, 248, 1)',
      background: 'rgba(241, 68, 64, 0.2)',
      dark: 'rgba(241, 68, 64, 0.5)',
      text: 'rgba(241, 68, 64, 1)',
      lightDark: 'rgba(241, 68, 64, 1)',
    },
    instagram: {
      primary: 'rgba(225, 48, 108, 1)',
      background: 'rgba(225, 48, 108, 0.15)',
      dark: 'rgba(180, 30, 85, 1)',
      gradient: {
        start: 'rgba(255, 166, 0, 1)', // Orange gradient start
        end: 'rgba(255, 0, 80, 1)', // Magenta gradient end
      },
    },
    telegram: {
      primary: 'rgba(29, 155, 240, 1)',
      background: 'rgba(29, 155, 240, 0.15)',
      dark: 'rgba(21, 101, 192, 0.88)',
      text: 'rgba(29, 155, 240, 1)',
    },
    note: {
      primary: 'rgba(243, 145, 88, 1)',
      background: 'rgba(153, 112, 0, 0.25)',
      dark: 'rgba(204, 153, 1, 1)',
      text: 'rgba(102, 85, 0, 1)',
    },
    location: {
      primary: 'rgba(59, 94, 131, 1)',
      background: 'rgba(82, 114, 150, 0.1)',
      dark: 'rgba(107, 164, 227, 1)',
      text: 'rgba(59, 94, 131, 1)',
    },
  },
  accent: {
    green: 'rgba(21, 255, 0, 1)',
    yellow: 'rgba(246, 255, 0, 1)',
    blue: 'rgba(48, 169, 255, 1)',
    darkBlue: 'rgba(64, 93, 240, 1)',
    lightBlue: 'rgba(38, 107, 235, 1)',
  },
};

const CommunicationPlatformColors = {
  whatsapp: ColorGroups.communication.whatsapp.primary,
  whatsappBackground: ColorGroups.communication.whatsapp.background,
  whatsappDark: ColorGroups.communication.whatsapp.dark,

  whatsappBusiness: ColorGroups.communication.whatsapp.business,
  whatsappBusinessBackground: ColorGroups.communication.whatsapp.businessBackground,
  whatsappBusinessDark: ColorGroups.communication.whatsapp.businessDark,

  sms: ColorGroups.communication.sms.primary,
  smsBackground: ColorGroups.communication.sms.background,
  smsDark: ColorGroups.communication.sms.dark,

  instagram: ColorGroups.communication.instagram.primary,
  instagramBackground: ColorGroups.communication.instagram.background,
  instagramDark: ColorGroups.communication.instagram.dark,
  instagramGradient: ColorGroups.communication.instagram.gradient,

  gmail: ColorGroups.communication.gmail.primary,
  gmailBackground: ColorGroups.communication.gmail.background,
  gmailDark: ColorGroups.communication.gmail.dark,
  gmailText: ColorGroups.communication.gmail.text,
  gmailLightDark: ColorGroups.communication.gmail.text,

  telegram: ColorGroups.communication.telegram.primary,
  telegramBackground: ColorGroups.communication.telegram.background,
  telegramDark: ColorGroups.communication.telegram.dark,
  telegramText: ColorGroups.communication.telegram.text,

  note: ColorGroups.communication.note.primary,
  noteBackground: ColorGroups.communication.note.background,
  noteDark: ColorGroups.communication.note.dark,
  noteText: ColorGroups.communication.note.text,

  location: ColorGroups.communication.location.primary,
  locationBackground: ColorGroups.communication.location.background,
  locationDark: ColorGroups.communication.location.dark,
  locationText: ColorGroups.communication.location.text,
};

export const LightThemeColors = {
  background: 'rgba(255, 255, 255, 1)',
  text: '#303334',
  grayBackground: 'rgba(255, 255, 255, 0.21)',
  black: '#000',
  white: 'rgba(255, 255, 255, 1)',
  lightGray: ColorGroups.gray.light,
  primary: 'rgba(48, 51, 52, 1)',
  lightWhite: 'rgba(233, 233, 233, 1)',
  grayTitle: ColorGroups.gray.medium,
  bottomTab: ColorGroups.gray.dark,
  green: ColorGroups.accent.green,
  reminderCardBackground: 'rgba(63, 65, 69, 1)',
  borderColor: ColorGroups.gray.border,
  placeholderText: 'rgba(0, 0, 0, 0.5)',
  scheduleReminderCardBackground: ColorGroups.gray.background,
  white08: 'rgba(255, 255, 255, 0.8)',
  darkPrimaryBackground: 'rgba(67, 69, 69, 1)',
  contactBackground: ColorGroups.gray.background,
  lightContact: 'rgba(139, 142, 142, 1)',
  yellow: ColorGroups.accent.yellow,
  blue: ColorGroups.accent.blue,
  darkBlue: ColorGroups.accent.darkBlue,
  lightBlue: ColorGroups.accent.lightBlue,
  previewBackground: 'rgba(236, 236, 236, 1)',
  ...CommunicationPlatformColors,
};

export const DarkThemeColors = {
  background: 'rgba(48, 51, 52, 1)', // #303334
  text: '#ffffff',
  grayBackground: 'rgba(255, 255, 255, 0.21)',
  black: '#000',
  white: 'rgba(255, 255, 255, 1)',
  lightGray: ColorGroups.gray.light,
  primary: 'rgba(48, 51, 52, 1)',
  lightWhite: 'rgba(233, 233, 233, 1)',
  grayTitle: 'rgba(255, 255, 255, 0.6)',
  bottomTab: ColorGroups.gray.dark,
  green: ColorGroups.accent.green,
  reminderCardBackground: 'rgba(63, 65, 69, 1)',
  borderColor: 'rgba(217, 217, 217, 1)',
  placeholderText: 'rgba(255, 255, 255, 0.6)',
  scheduleReminderCardBackground: 'rgba(63, 65, 69, 1)',
  white08: 'rgba(255, 255, 255, 0.8)',
  darkPrimaryBackground: 'rgba(67, 69, 69, 1)',
  contactBackground: 'rgba(63, 65, 69, 1)',
  lightContact: 'rgba(139, 142, 142, 1)',
  yellow: ColorGroups.accent.yellow,
  blue: ColorGroups.accent.blue,
  darkBlue: ColorGroups.accent.darkBlue,
  lightBlue: ColorGroups.accent.lightBlue,
  previewBackground: 'rgba(63, 65, 69, 1)',
  ...CommunicationPlatformColors,
  location: 'rgba(107, 164, 227, 1)',
};

export const FONTS = {
  Regular: 'ClashGrotesk-Regular',
  Medium: 'ClashGrotesk-Medium',
  Bold: 'ClashGrotesk-Bold',
  SemiBold: 'ClashGrotesk-Semibold',
};

export const SIZE = {
  appContainWidth: '95%' as DimensionValue,
  listBorderRadius: 15,
};

export const ActiveOpacity = 0.8;
