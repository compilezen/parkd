# Current direction — Your way back

Version 0.2.0 implements numbered return steps using entrance, lift/stairs, floor, zone, and space. This replaces the earlier three-photo-trail proposal. One optional parking photo remains. Next priorities: physical-device keyboard and Maps handoff checks, photo zoom, and optional parking-expiry reminders.

## Physical-device acceptance test

Before describing parkd as reliable underground, test the APK on real Android phones:

1. In a garage, deny location permission and save a real space/sign photo plus floor, zone, and entrance in the note.
2. Turn on airplane mode, force-stop the app, then reopen it. Verify the full photo and all clues are still readable.
3. Walk to the building entrance and return using only saved clues. Repeat on another level and with a different entrance. Record whether someone unfamiliar with the garage succeeds.
4. Exercise camera denial, picker cancellation, portrait/landscape camera images, and large or HEIC images supported by the phone.
5. Test large system text, keyboard visibility, Android back navigation, low storage, app update, and actual Maps handoff.

Automated browser tests cannot establish real-world wayfinding success, native camera behavior, Android process restoration, or GPS accuracy.
