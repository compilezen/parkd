# parkd languages and Home Screen widget — 0.4.0

The globe beside the three dots selects English, Arabic, Mandarin Chinese (Simplified), Spanish, or Hindi. All app-authored screen text, labels, placeholders, validation/errors, return-step instructions, dates, parking notification actions, and widget content are bundled locally. No translation API, account, or internet connection is used. The choice persists separately from the parking spot.

Arabic uses right-to-left layout and text alignment immediately; no restart is required. The brand stays left-to-right. Entered notes, landmark names, floor/zone/space codes, and photos are never modified or sent for translation. Maps, keyboards, photo pickers, OS settings, and system permission buttons follow the phone's language. Native iOS permission explanations are provided in the five locales.

## Android display

The saved parking card is intentionally a standard notification. Starting Find my car requests prominent Live Update presentation during the active return. Android 16+ capability, OS updates, user settings, and manufacturer rules control promotion. A notification seen only in the drawer does not by itself establish an app bug. The app now distinguishes older Android, promotion disabled, and system-controlled display, with a settings link where supported.

For a persistent Home Screen card on supported app versions (including older Android phones), tap **Home Screen widget**. On supported launchers this opens the pin-widget confirmation. Otherwise, long-press an empty Home Screen area, choose Widgets, and choose parkd. The widget works independently of notification permission, updates with saved clues/progress/language, and resets when the spot is cleared. Tapping opens parkd. Resize it for long clues. It stores a local text snapshot for the launcher; no photo or coordinates are copied to that snapshot.

## Validation

The language browser test covers all five languages across home, editor, validation, saved view, return steps, and About; language/progress persistence, unchanged notes, 320 px layout, and a failed language save. Screenshots are in languages/. Unit tests verify complete translations and matching interpolation fields. Native Android tests cover widget refresh when notifications are denied or hidden, translated empty state, and RTL.

Native notification/widget appearance, launcher pinning, font fallback, and promotion still need physical-phone testing. iOS JavaScript export and generated localized permission files can be checked here; a signed iPhone build is still needed for native Live Activities/widgets. Expo Go tests the regular app screens.

Sources: https://developer.android.com/develop/ui/views/notifications/live-update and https://docs.expo.dev/guides/localization/.
