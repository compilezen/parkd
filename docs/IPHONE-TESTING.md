# Test parkd on an iPhone

parkd uses the same application code on iOS and Android. Its iOS bundle identifier is `com.compilezen.parkd`. This guide covers the current app, including the keyboard-aware form, Apple Maps pin, offline saved clues, and Your way back steps.

## Free first test with Expo Go

1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) on your iPhone.
2. Create a [free Expo account](https://expo.dev/signup) and sign in to Expo Go.
3. On your Windows computer, install [Node.js 24 LTS](https://nodejs.org/en/download).
4. [Download parkd's source ZIP](https://github.com/compilezen/parkd/archive/refs/heads/main.zip) and extract it completely.
5. Open the extracted `parkd-main` folder and double-click `Test-on-iPhone.cmd`. It installs dependencies, asks you to log in to the same Expo account, and starts the preview. Put your iPhone and computer on the same Wi-Fi.
6. Scan the terminal's QR code with your iPhone Camera and open it in Expo Go. Keep the computer window open while testing.

Expo Go currently requires the physical iPhone and Expo CLI to use the same Expo account. The default launcher uses your local Wi-Fi; allow Node through the Windows firewall on your private network. This development preview is not a standalone install or a verification of airplane-mode cold launches. Saved clues still use on-device storage, but opening/reloading a development bundle requires the development server.

On macOS or Linux, from the downloaded project folder:

```sh
npm ci
npx expo login
npx expo start --go --lan
```

### If the tunnel package is missing in an older download

For `CommandError: Install @expo/ngrok@^4.1.0 and try again`, open a terminal in the existing project folder and run:

```sh
npm install --global "@expo/ngrok@^4.1.0"
npx expo start --go --tunnel
```

This installs the tunnel package without changing parkd's application dependencies. The updated Windows launcher uses LAN by default and needs no ngrok. If you need a tunnel, run `Test-on-iPhone.cmd --tunnel`; that optional mode installs ngrok.

## Live Activity and Home Screen widget

The 0.3.0 source includes an iOS Live Activity and small/medium Home Screen widget. They show saved clues and your current return step; tapping opens Your way back. Confirming you are back ends the Live Activity and resets the widget. Updates are local, with no push server.

**Expo Go cannot run these native features.** It can test the normal parking screens and logo. To test Live Activities/widgets, install a signed iPhone build using the steps below. After installing it, add parkd from the Home Screen widget gallery. iOS controls activity duration and widget refresh timing; the saved spot stays in the app. A dismissed activity is not restarted just by reopening parkd.

## Standalone iPhone build

The `iphone` EAS build profile generates an internal-distribution device build. It needs a connected Expo project, a paid Apple Developer membership, signing credentials, and registration of the test iPhone. No paid account is required for the Expo Go path above.

Once that account setup is available, run these interactively from the project folder:

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile iphone
```

EAS provides a device registration link and then an installation link for the signed build. Only registered devices included in the provisioning profile can install it. TestFlight is another later distribution option; this project does not automatically upload to the App Store or TestFlight.

## What to check

- Save a spot with location denied, enter entrance/lift/floor/zone/space, and view Your way back.
- Take and choose a photo; cancel the picker and deny camera permission.
- Focus the note with the keyboard open, scroll the form, and press Done.
- Open the saved pin in Apple Maps on the first tap, including when Maps was previously closed.
- Reopen parkd and check that the saved clues remain.
- On a standalone signed app, also test force-stop/reopen in airplane mode. Expo Go testing does not establish this standalone behavior.

## Validation and limits

On 12 October 2026, the iOS JavaScript/Hermes export, strict TypeScript check, and Expo lint passed in the workspace. The Windows launcher was reviewed but has not been run on a Windows computer. It is not a signed `.ipa`, an Xcode compilation, or a physical-device test. The workspace has no authenticated Expo session or Apple signing credentials, so no signed iPhone package has been produced.

Sources: [Expo start developing](https://docs.expo.dev/get-started/start-developing/), [Expo CLI tunnels](https://docs.expo.dev/more/expo-cli/#tunneling), and [internal iOS distribution](https://docs.expo.dev/build/internal-distribution/).
