# Finding a car without GPS — proposed next iteration

These are proposals, not features included in version 0.1.2.

## First priority: a short photo trail

Keep the one-tap GPS save, and make **Save with photos** equally discoverable. For a garage, offer three optional labeled clues:

1. **My space** — the car with a numbered pillar or bay sign.
2. **Lift / stairs** — the lift name or color and the parking level.
3. **Entrance** — the door or shop landmark used to leave the garage.

On return, show the entrance first, then lift/stairs, then the car. Users can swipe between full photos and add a short caption to each. The trail is a visual memory aid, not calculated indoor navigation. If the return entrance differs, the user must first recognize one of the saved landmarks.

Floor and zone should remain optional, fast fields. Add an entrance/lift field so an otherwise ambiguous “B2” is associated with a route. A gentle prompt can ask for another clue when there is only a floor or an approximate GPS pin; do not describe this as a guarantee of finding the car.

Store photos in durable app document files with metadata, rather than adding multiple large base64 images to the current single storage value. Preserve version-1 saved spots during migration. Verify deletion, interrupted writes, and storage-full recovery before shipping a gallery.

## UI changes to preview

- Retain cobalt blue, soft white, rounded cards, and the single primary action.
- Put floor, zone, and entrance near the top of the saved screen. On a small phone, the current decorative illustration can push these clues below the fold.
- Use a labeled photo strip for the trail; tapping a photo opens a full-screen, zoomable view.
- In the no-GPS return screen, make the saved clues the main content and explain once that there is no GPS pin.
- Keep the completed state explicit: “Saved on this phone.” Show success only after storage has completed.

## Useful additions, in order

| Priority | Addition | Benefit |
| --- | --- | --- |
| 1 | Photo trail and entrance/lift clue | Helps reconstruct the return path without GPS |
| 2 | Pinch-to-zoom photos | Makes small pillar and bay numbers easier to read |
| 3 | Optional parking-expiry reminder | Helps avoid overstaying paid parking |
| 4 | Share a parking card | Gives family the photos and clues through the phone's share sheet |
| 5 | On-device sign recognition, with confirmation | Suggests floor/zone text from a photo while letting the user correct it |

Keep reminders, sharing, and recognition out of the initial save flow until requested. Avoid adding accounts, feeds, or a complicated dashboard.

## Physical-device acceptance test

Before describing parkd as reliable underground, test the APK on real Android phones:

1. In a garage, deny location permission and save a real space/sign photo plus floor, zone, and entrance in the note.
2. Turn on airplane mode, force-stop the app, then reopen it. Verify the full photo and all clues are still readable.
3. Walk to the building entrance and return using only saved clues. Repeat on another level and with a different entrance. Record whether someone unfamiliar with the garage succeeds.
4. Exercise camera denial, picker cancellation, portrait/landscape camera images, and large or HEIC images supported by the phone.
5. Test large system text, keyboard visibility, Android back navigation, low storage, app update, and actual Maps handoff.

Automated browser tests cannot establish real-world wayfinding success, native camera behavior, Android process restoration, or GPS accuracy.
