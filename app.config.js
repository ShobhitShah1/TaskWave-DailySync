import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  plugins: [
    ...config.plugins.filter(
      (plugin) =>
        !(Array.isArray(plugin) && plugin[0] === 'react-native-maps')
    ),
    [
      'react-native-maps',
      {
        iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS,
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
      },
    ],
    ...config.plugins.filter(
      (plugin) =>
        Array.isArray(plugin) && plugin[0] !== 'react-native-maps'
    ),
  ],
}); 