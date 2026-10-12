# parkd 0.3.0 native feature testing

## Android

Install the release APK; save a manual spot with entrance Bershka, lift A, floor B1, zone X, space 142. Allow notifications when requested.

- Parked: a quiet, normal parking card appears. It does not request promoted Live Update presentation.
- Tap Find my car or the card: active return mode displays the current step. Advance with “I’m here · Next step” and check the card changes.
- Swipe away or choose Hide: reopening/editing the same spot must not restore the card. “Show parking update” explicitly restores it.
- Confirm “I’m back at my car”: saved spot and card disappear.
- Deny/block notifications: saving and finding still work. Enable notification access in settings and explicitly show the update.
- Restart app, airplane mode, edit clues, save another spot, and complete with notifications disabled. No GPS is needed for manual clues.
- A supported Android version/OEM and enabled promotion settings are required for prominent Live Updates. Standard notification fallback remains available. This is manually entered landmark guidance, not automatic indoor navigation.

The APK workflow compiles the native module and runs three Robolectric lifecycle/permission tests. These simulate Android framework behavior; they do not establish real-device promotion, lock-screen appearance, camera behavior, or battery-management behavior.

## iPhone signed build

Expo Go tests normal screens only. Install a signed iPhone build to test these native features.

- Save a spot: Live Activity shows clues on supported system surfaces.
- Add the small and medium parkd widgets from the Home Screen gallery; check readable text with long clues, light/dark appearance, and tinted widgets.
- Begin return and advance steps: activity and widget reflect progress; tap either to open Your way back.
- Dismiss the activity and reopen: it stays dismissed until explicitly requested again.
- Disable Live Activities: widget and saved spot remain usable.
- Confirm return: activity ends, widget becomes empty state.
- Relaunch offline: saved clues remain. OS controls widget refresh timing and activity lifetime.

No Apple signing credentials are configured in this workspace. iOS configuration generation and JavaScript exports can be checked here; Xcode compilation and physical-device validation require the signed-build setup in IPHONE-TESTING.md.

Sources: https://developer.android.com/develop/ui/compose/notifications/live-update and https://docs.expo.dev/versions/v57.0.0/sdk/widgets/.
