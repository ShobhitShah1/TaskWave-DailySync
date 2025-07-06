# DailySync

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://prettier.io/)

## Code Quality Workflow

- **Formatting:** Automatically checked on commit with Prettier.
- **Linting:** Checked on push with ESLint.
- **Type Checking:** Checked on push with TypeScript.
- **Commit Messages:** Enforced with commitlint (Conventional Commits).

### Scripts

- `yarn lint` — Run ESLint
- `yarn format` — Run Prettier

## Environment Setup

### Google Maps API Keys

This project uses Google Maps API keys that need to be configured for both iOS and Android platforms.

1. **Create a `.env` file** in the root directory:

   ```bash
   # Option 1: Use the setup script (recommended)
   yarn setup:env

   # Option 2: Manual setup
   cp env.example .env
   ```

2. **Get your Google Maps API keys**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Maps SDK for iOS and Android
   - Create API keys for both platforms
   - Restrict the keys to your app's bundle ID/package name

3. **Update the `.env` file** with your actual API keys:

   ```env
   GOOGLE_MAPS_API_KEY_IOS=your_actual_ios_api_key_here
   GOOGLE_MAPS_API_KEY_ANDROID=your_actual_android_api_key_here
   ```

4. **Important Security Notes**:
   - Never commit your `.env` file to version control
   - The `.env` file is already added to `.gitignore`
   - Use different API keys for development and production
   - Restrict your API keys to specific bundle IDs and IP addresses

### Contributing

- Please follow the commit message guidelines and ensure code passes all checks before pushing.
