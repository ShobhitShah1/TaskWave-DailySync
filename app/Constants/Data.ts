import { Sound } from '../Types/Interface';
import AssetsPath from './AssetsPath';

export const OnBoardingData = [
  {
    id: 1,
    title: 'Schedule  text  message',
    description: 'Now schedule all your text messages with just few easy clicks',
    image: AssetsPath.ob_TextMessage,
  },
  {
    id: 2,
    title: 'Schedule all your mail',
    description: 'Schedule all your mails to send at that perticular time without any delay',
    image: AssetsPath.ob_Email,
  },
  {
    id: 3,
    title: 'WhatsApp  messages',
    description: 'Schedule your WhatsApp messages to send it at perfect time at one place',
    image: AssetsPath.ob_Whatsapp,
  },
  {
    id: 4,
    title: 'WhatsApp business',
    description: 'Schedule your WhatsApp business messages to send it at perfect time',
    image: AssetsPath.ob_WhatsappBusiness,
  },
];

export const sounds: Sound[] = [
  {
    name: 'System default',
    duration: null,
    category: 'System',
    soundKeyName: 'default',
    uri: null,
    canPlay: false,
  },
  // {
  //   name: "Correct answer tone",
  //   duration: "0:02",
  //   category: "Classic",
  //   soundKeyName: "correct_answer_tone",
  //   uri: AssetsPath.correct_answer_tone,
  //   canPlay: true,
  // },
  // {
  //   name: "Long pop",
  //   duration: "0:00",
  //   category: "Classic",
  //   soundKeyName: "long_pop",
  //   uri: AssetsPath.long_pop,
  //   canPlay: true,
  // },
  // {
  //   name: "Positive notification",
  //   duration: "0:03",
  //   category: "Nature",
  //   soundKeyName: "positive_notification",
  //   uri: AssetsPath.positive_notification,
  //   canPlay: true,
  // },
  // {
  //   name: "Software interface back",
  //   duration: "0:01",
  //   category: "Classic",
  //   soundKeyName: "software_interface_back",
  //   uri: AssetsPath.software_interface_back,
  //   canPlay: true,
  // },
  // {
  //   name: "Software interface remove",
  //   duration: "0:02",
  //   category: "Modern",
  //   soundKeyName: "software_interface_remove",
  //   uri: AssetsPath.software_interface_remove,
  //   canPlay: true,
  // },
  {
    name: 'Ting tong',
    duration: '0:02',
    soundKeyName: 'ting_tong',
    category: 'Modern',
    uri: AssetsPath.ting_tong,
    canPlay: true,
  },
  {
    name: 'Tink tink',
    duration: '0:02',
    soundKeyName: 'tink_tink',
    category: 'Modern',
    uri: AssetsPath.tink_tink,
    canPlay: true,
  },
].map((item, index) => ({ ...item, id: index.toString() }));
