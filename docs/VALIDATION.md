# Validation — 11 October 2026

## Passed

- TypeScript strict type check.
- Expo ESLint configuration, no errors or warnings.
- Three Node test groups: manual spots, zero-coordinate navigation, and invalid stored data.
- Web production export.
- Android and iOS JavaScript/Hermes bundle exports.
- SDK package compatibility check using the installed Expo SDK's bundled version data. Online React Native Directory verification was unavailable in the build environment.
- Headless Chromium check at 390 × 844: manual save, empty form validation, floor/zone/note save, reopening restores the spot, navigation to saved details, canceling clear, and confirmed clear.
- Mock GPS coordinates produce a saved location and enable the Maps action.
- Photo selection, JPEG resizing/compression, saving, and persistence after reload.
- Loading the details route directly preserves previously saved GPS coordinates.
- 320 × 640 editor check: no horizontal page overflow.
- Mock permission denial preserves the manual-save option.
- Mock failed storage writes show an error and do not claim that a spot was saved.
- No uncaught browser page errors during the main flow.

`docs/*.png` are screenshots of the implementation's web rendering. The shown floor, zone, and note are test data. They are not photographs or location data from the user.

## Run UI checks

```sh
npm run export:web
npx playwright install chromium
npm run test:ui
```

`CHROMIUM_EXECUTABLE_PATH` can select an existing Chromium binary in restricted build environments. The test uses a local server on port 8083 and saves screenshots to `docs/`.

## Still required before release

- A signed Android APK / iOS device build.
- Physical-device camera, location permissions, indoor GPS accuracy, safe area, and keyboard tests.
- Actual Apple Maps / Google Maps app handoff on phones. The browser test checks action availability; the unit tests validate the destination URL.
- Long-lived storage behavior and OS backup review on target devices.

Bundle exports are not signed installable binaries. No APK, IPA, store submission, or release deployment has been produced yet.
