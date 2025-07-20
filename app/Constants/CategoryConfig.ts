import { NotificationType } from '@Types/Interface';
import AssetsPath from './AssetsPath';
import { LightThemeColors } from './Theme';

export const categoriesConfig = (colors: typeof LightThemeColors) => {
  const categories = [
    {
      type: 'whatsapp' as NotificationType,
      title: 'Whatsapp',
      description: "Let's create whatsapp event",
      glowIcon: AssetsPath.ic_whatsappGlow,
      icon: AssetsPath.ic_whatsapp,
      history_icon: AssetsPath.ic_whatsapp_history,
      color: {
        background: colors.whatsappBackground,
        primary: colors.whatsapp,
        dark: colors.whatsappDark,
      },
    },
    {
      type: 'whatsappBusiness' as NotificationType,
      title: 'WA Business',
      description: "Let's create business event",
      glowIcon: AssetsPath.ic_whatsappBusinessGlow,
      icon: AssetsPath.ic_whatsappBusiness,
      history_icon: AssetsPath.ic_whatsappBusiness_history,
      color: {
        background: colors.whatsappBusinessBackground,
        primary: colors.whatsappBusiness,
        dark: colors.whatsappBusinessDark,
      },
    },
    {
      type: 'SMS' as NotificationType,
      title: 'SMS',
      description: "Let's create text messages event",
      icon: AssetsPath.ic_sms,
      glowIcon: AssetsPath.ic_smsGlow,
      history_icon: AssetsPath.ic_sms_history,
      color: {
        background: colors.smsBackground,
        primary: colors.sms,
        dark: colors.smsDark,
      },
    },
    {
      type: 'gmail' as NotificationType,
      title: 'Email',
      description: "Let's compose mail event",
      icon: AssetsPath.ic_gmail,
      glowIcon: AssetsPath.ic_gmailGlow,
      history_icon: AssetsPath.ic_gmail_history,
      color: {
        background: colors.gmailBackground,
        primary: colors.gmail,
        dark: colors.gmailDark,
        lightDark: colors.gmailLightDark,
      },
    },
    {
      type: 'phone' as NotificationType,
      title: 'Phone',
      description: "Let's create phone event",
      icon: AssetsPath.ic_phone,
      glowIcon: AssetsPath.ic_phoneGlow,
      history_icon: AssetsPath.ic_phone_history,
      color: {
        background: colors.smsBackground,
        primary: colors.sms,
        dark: colors.smsDark,
      },
    },
    {
      type: 'telegram' as NotificationType,
      title: 'Telegram',
      description: "Let's create telegram event",
      icon: AssetsPath.ic_telegram,
      glowIcon: AssetsPath.ic_telegramGlow,
      history_icon: AssetsPath.ic_telegram_history,
      color: {
        background: colors.telegramBackground,
        primary: colors.telegram,
        dark: colors.telegramDark,
      },
    },
    {
      type: 'note' as NotificationType,
      title: 'Note',
      description: "Let's create note event",
      icon: AssetsPath.ic_notes,
      glowIcon: AssetsPath.ic_notesGlow,
      history_icon: AssetsPath.ic_notes_history,
      color: {
        background: colors.noteBackground,
        primary: colors.note,
        dark: colors.noteDark,
      },
    },
    {
      type: 'location' as NotificationType,
      title: 'Location',
      description: 'Create a location-based reminder',
      icon: AssetsPath.ic_locationGlow,
      glowIcon: AssetsPath.ic_locationGlow,
      history_icon: AssetsPath.ic_locationGlow,
      color: {
        background: colors.blue,
        primary: colors.blue,
        dark: colors.darkBlue,
      },
    },
    // {
    //   type: "instagram" as NotificationType,
    //   title: "Instagram",
    //   description: "Let's create Instagram messages event",
    //   icon: AssetsPath.ic_instagram,
    //   color: {
    //     background: colors.instagramBackground,
    //     primary: colors.instagram,
    //     dark: colors.instagramDark,
    //   },
    // },
  ];

  return categories.map((category, index) => ({
    ...category,
    id: index + 1,
  }));
};
