import { NotificationType } from "../Types/Interface";
import AssetsPath from "./AssetsPath";
import { LightThemeColors } from "./Theme";

export const categoriesConfig = (colors: typeof LightThemeColors) => [
  {
    id: 1,
    type: "whatsapp" as NotificationType,
    title: "Whatsapp",
    description: "Let’s create whatsapp event",
    icon: AssetsPath.ic_whatsapp,
    color: {
      background: colors.whatsappBackground,
      primary: colors.whatsapp,
      dark: colors.whatsappDark,
    },
  },
  {
    id: 2,
    type: "whatsappBusiness" as NotificationType,
    title: "WA Business",
    description: "Let’s create business event",
    icon: AssetsPath.ic_whatsappBusiness,
    color: {
      background: colors.whatsappBusinessBackground,
      primary: colors.whatsappBusiness,
      dark: colors.whatsappBusinessDark,
    },
  },
  // {
  //   id: 3,
  //   type: "instagram" as NotificationType,
  //   title: "Instagram",
  //   description: "Let’s create Instagram messages event",
  //   icon: AssetsPath.ic_instagram,
  //   color: {
  //     background: colors.instagramBackground,
  //     primary: colors.instagram,
  //     dark: colors.instagramDark,
  //   },
  // },
  {
    id: 4,
    type: "SMS" as NotificationType,
    title: "SMS",
    description: "Let’s create text messages event",
    icon: AssetsPath.ic_sms,
    color: {
      background: colors.smsBackground,
      primary: colors.sms,
      dark: colors.smsDark,
    },
  },
  {
    id: 5,
    type: "gmail" as NotificationType,
    title: "Email",
    description: "Let’s compose mail event",
    icon: AssetsPath.ic_gmail,
    color: {
      background: colors.gmailBackground,
      primary: colors.gmail,
      dark: colors.gmailDark,
    },
  },
  {
    id: 6,
    type: "phone" as NotificationType,
    title: "Phone",
    description: "Let’s create phone event",
    icon: AssetsPath.ic_phone,
    color: {
      background: colors.smsBackground,
      primary: colors.sms,
      dark: colors.smsDark,
    },
  },
  {
    id: 7,
    type: "telegram" as NotificationType,
    title: "Telegram",
    description: "Let’s create telegram event",
    icon: AssetsPath.ic_telegram,
    color: {
      background: colors.telegramBackground,
      primary: colors.telegram,
      dark: colors.telegramDark,
    },
  },
];
