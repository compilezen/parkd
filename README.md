# parkd

A small, calm parking-memory app. Save your spot, add a few clues, and find your car later.

An independent project with its own application identifiers (`com.compilezen.parkd`). No Amanah Vault code, configuration, credentials, or services are used.

![parkd app screens](docs/parkd-preview.png)

## First version

- One active spot, saved locally on the device.
- GPS save with permission handling and a 12-second position timeout.
- A manual option for garages and unavailable GPS.
- Camera or photo-library image, resized before local storage.
- Floor, zone/space, and a short note.
- Restores the saved spot when the app reopens.
- Walking directions through Apple Maps on iOS or Google Maps on Android/web.
- Confirmation before clearing the spot and photo.
- No accounts, ads, analytics, background tracking, or server.

## Run locally

Use Node.js 24 LTS and npm.

```sh
npm ci
npm start
```

For the browser preview, run `npm run web`. Location requires HTTPS or localhost. A browser preview is useful for UI testing; validate camera, location, safe areas, and Maps handoff on actual phones before releasing.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run test:ui # after installing Playwright Chromium and exporting web
npm run export:web
npm run export:mobile
```

## Android test build

The `preview` EAS profile produces an installable Android APK. Connect your own Expo account and EAS project first:

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

An iOS device build needs the appropriate Apple signing setup. No store submissions or cloud builds have been performed as part of this source project.

## Scope and privacy

The initial app opens the phone's Maps app; it does not embed a live map. The illustrated home card is decorative, not a map. Floor and zone are manually entered: GPS does not identify indoor levels or provide indoor navigation. GPS accuracy is shown on the find screen, and lower-accuracy fixes prompt the user to add details.

Parking details and a compressed photo are stored in AsyncStorage on the device. This is local app storage, not encrypted storage. Maps receives the saved coordinates only when the user taps Open in Maps. Device/OS backups may retain app data according to the user's backup settings. Clearing app data or uninstalling removes the app's local spot. Photo capture/manipulation may leave OS-managed temporary cache files until the operating system clears them.

## Project structure

- `src/app/`: home, editor, find, photo, and about routes.
- `src/ui.tsx`: shared cream-and-teal visual components.
- `src/store.tsx`: loading and persistent storage.
- `src/parking.ts`: parking data validation and directions URLs.
- `tests/`: data and navigation unit tests.
- `docs/`: product scope, validation record, and actual UI screenshots.

## Next milestones

1. Test the build on real Android and iPhone devices.
2. Add an embedded map if it improves the save/find flow; configure map provider credentials separately.
3. Consider a parking expiry reminder after the basic flow is proven.
