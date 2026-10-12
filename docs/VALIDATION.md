# Validation — 12 October 2026

## About screen newline fix — 0.2.1

The About heading and app-data footer previously rendered literal backslash-n characters because the escapes were written directly in JSX text. They now use JavaScript string expressions so real line breaks render. The browser smoke test checks the heading and footer text, and verifies that no literal backslash-n is visible. Strict typecheck, lint, web export, and the smoke suite passed. The font comparisons are separate preview artifacts; app typography has not changed.


## Your way back and phone-reported issues — 0.2.0

Validation passed: 17 resilience scenarios, the original browser smoke suite, five unit test groups, strict TypeScript, lint, and web export. Native keyboard and Maps behavior still require device verification.

- Added optional entrance, lift/stairs, and parking-space fields without changing the storage key. Existing saved spots remain readable.
- Added large numbered return steps built from the actual saved clues. They remain local and do not depend on GPS or a routing service.
- Replaced the editor's basic scroll container on native devices with Expo-compatible Keyboard Controller's keyboard-aware scroll view and toolbar. Notes use Done/blur-and-submit instead of adding a line on Enter. Android is configured for keyboard resize.
- Maps now receives a direct saved-pin URL (Android geo intent, iOS Apple Maps pin). If the native open rejects, one Google Maps web-pin fallback is attempted. The button prevents duplicate requests while opening. This avoids requesting a route from the user's current location just to display a pin.
- Added tests for legacy records, missing clues, ordered return steps, direct pin URLs, fallback behavior, and total launch failure. Browser scenarios cover Enter ending note entry, stored steps after reload and offline, and first-click pin URL dispatch (window.open is intercepted).
- The original Android first-tap Maps failure could not be reproduced on a physical device here. Native keyboard overlap and Maps cold-start behavior must be confirmed on the user's phone. Browser tests do not establish native keyboard or external app behavior.

Official implementation references: [Expo keyboard handling](https://docs.expo.dev/guides/keyboard-handling/), [React Native TextInput](https://reactnative.dev/docs/textinput#submitbehavior), and [Android Maps pin intents](https://developer.android.com/guide/components/google-maps-intents#search-for-a-location).


## Photo and no-GPS regression pass — 0.1.2

Found and fixed: the details screen previously kept Save enabled while the system photo picker was open. The editor now blocks saving and further photo actions until selection, cancellation, or failure has completed. A regression test reproduced the issue before the fix and passed afterward.

Added `npm run test:resilience` with 15 browser scenarios:

- Six deterministic synthetic image types: 4032×3024 landscape JPEG, 3024×4032 portrait JPEG, 3000×600 panorama JPEG, 320×240 PNG, 1400×1400 transparent PNG, and 1920×1080 dark JPEG.
- Three distinct replacements per type: 18 photo save/replacement cycles. Each checks JPEG decoding, maximum dimensions, aspect ratio, changed image bytes, persisted content after reload, no-GPS saving while network access is disabled, and offline navigation to the full photo. Removing a photo retains the text clues.
- Picker lock and cancellation recovery; malformed image recovery.
- GPS timeout fallback; a late GPS response cannot replace a manually saved spot.
- Failed delete and failed edit preserve the saved spot; damaged saved data cannot be silently overwritten.
- A photo-only manual spot cannot lose its last clue through an empty save.
- Long floor/zone text and Arabic notes at 320×640 stay within the viewport.

The 15 scenarios passed after the fix (14 together, followed by the corrected long-text test). The long-text fixture originally exceeded the input's 20-character limit; the test was corrected to use that limit. The original smoke suite, strict typecheck, lint, and three unit test groups also passed. Both browser suites now run in GitHub checks on future changes.

These are tests of the web rendering and shared application logic, with simulated GPS/storage failures. The six generated fixtures test image handling, not whether a real garage photograph provides enough clues. A web reload uses the local bundle server; this is not a native airplane-mode cold-launch test. Physical Android camera, HEIC decoding, app force-stop/restart, native accessibility, and real-world wayfinding remain unverified. See [proposed next steps and the device test](NEXT-STEPS.md).

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
npm run test:resilience
```

`CHROMIUM_EXECUTABLE_PATH` can select an existing Chromium binary in restricted build environments. The test uses a local server on port 8083 and saves screenshots to `docs/`.

The resilience suite uses port 8084 and writes screenshots and JSON results to the ignored `test-results/` directory. `SCENARIO='long clues' npm run test:resilience` runs a matching scenario in isolation. Test images are generated locally without downloading personal photos.

## Android test build

- GitHub Actions run [38179003939](https://github.com/compilezen/parkd/actions/runs/38179003939) completed successfully, including native release compilation, APK signature verification, bundled JavaScript verification, and release upload.
- [Download parkd 0.1.1 for Android arm64](https://github.com/compilezen/parkd/releases/download/v0.1.1-test.2/parkd-0.1.1-arm64.apk). The prerelease includes a SHA-256 checksum.
- Standalone test APK: no Expo Go or development server required. Uses test signing, not production store signing.
- The approved cobalt blue theme is included.

## Still required before production release

- Production signing and an iOS device build.
- Physical-device camera, location permissions, indoor GPS accuracy, safe area, and keyboard tests.
- Actual Apple Maps / Google Maps app handoff on phones. The browser test checks action availability; the unit tests validate the destination URL.
- Long-lived storage behavior and OS backup review on target devices.

The Android APK is available for device testing. No physical-device validation, IPA, or store submission has been completed.
