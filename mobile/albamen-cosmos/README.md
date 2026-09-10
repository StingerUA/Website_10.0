# ALBAMEN Cosmos — Android wrapper

This Expo project packages only the ALBAMEN Cosmos web game:

`https://albaspace.com.tr/games/albamen-cosmos/?lang=tr`

It does not package or open the full AlbaSpace website as the home screen.

## Requirements

- Node.js 22.13 or newer (recommended for Expo SDK 57)
- An Expo account
- EAS CLI (the npm scripts use the latest CLI automatically)

## First-time setup

```bash
cd mobile/albamen-cosmos
npm install
npx expo-doctor@latest
npx eas-cli@latest login
npx eas-cli@latest init
```

`eas init` links this folder to your Expo account and writes the EAS project ID into the Expo config.

## Build an installable APK

```bash
npm run build:apk
```

The `preview` profile in `eas.json` produces an `.apk` that can be installed directly on an Android phone.

## Build a Google Play AAB

```bash
npm run build:aab
```

The `production` profile produces an Android App Bundle (`.aab`) for Google Play Console and automatically increments the Android build number on EAS.

## Android identity

- App name: `ALBAMEN Cosmos`
- Android package: `com.albaspace.albamencosmos`
- Start URL: `https://albaspace.com.tr/games/albamen-cosmos/?lang=tr`

Do not change the Android package name after the app has been published to Google Play.

## Current wrapper behavior

- Opens only ALBAMEN Cosmos as the start screen.
- Uses the existing online game, so most game-content updates do not require publishing a new APK/AAB.
- Shows a native Turkish retry screen when the web page fails to load.
- Android Back navigates back inside the WebView when possible.
- AlbaSpace and Google authentication hosts are allowed inside the WebView so the existing sign-in flow can be tested.
- Other HTTPS links open in the device browser instead of replacing the game.

## Before Google Play production release

Create final branded Android icon/splash assets, test Google sign-in on a physical Android device, review Play Console Data safety declarations, privacy policy, content rating and target audience settings, and run the required testing track for the developer account.
