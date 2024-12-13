import AssetsPath from "../Global/AssetsPath";
import { LightThemeColors } from "../Global/Theme";
import { remindersCategoriesType } from "../Types/Interface";

export const getCategories = (
  colors: typeof LightThemeColors
): remindersCategoriesType[] => [
  {
    id: 1,
    type: "whatsapp",
    title: "Whatsapp",
    description: "Let’s create whatsapp event",
    icon: AssetsPath.ic_whatsapp,
    color: colors.whatsapp,
  },
  {
    id: 2,
    type: "whatsappBusiness",
    title: "WA Business",
    description: "Let’s create business event",
    icon: AssetsPath.ic_whatsappBusiness,
    color: colors.whatsappBusinessDark,
  },
  {
    id: 3,
    type: "instagram",
    title: "Instagram",
    description: "Let’s create instagram messages event",
    icon: AssetsPath.ic_instagram,
    color: colors.instagram,
  },
  {
    id: 4,
    type: "SMS",
    title: "SMS",
    description: "Let’s create text messages event",
    icon: AssetsPath.ic_sms,
    color: colors.sms,
  },
  {
    id: 5,
    type: "gmail",
    title: "Email",
    description: "Let’s compose mail event",
    icon: AssetsPath.ic_gmail,
    color: colors.gmail,
  },
  {
    id: 6,
    type: "phone",
    title: "Phone",
    description: "Let’s create phone event",
    icon: AssetsPath.ic_phone,
    color: colors.sms,
  },
];
