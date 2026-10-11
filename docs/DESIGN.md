# parkd — version 0.1

## Principle

One spot, one obvious next action. Saving should never require an account, a photo, or typing when GPS is available.

## Flow

Home → Save my spot → Saved spot → Find my car → Open in Maps → I’m back → Confirm clear.

Manual fallback: Home → Save without GPS → Add at least one helpful detail → Save details.

Optional details: floor, zone/space, note, and one photo. Edit them after saving. Save details explicitly commits changes; leaving the editor discards unsaved edits.

## Visual language

- Warm ivory `#FAF8F3` background.
- Deep teal `#086C68` actions.
- Dark green `#193334` text.
- Sage surfaces, rounded 16–28 pt cards, generous whitespace.
- 44 pt minimum interactive controls and 60 pt primary buttons.
- System typography, large headlines, restrained outline icons.
- No bottom tab bar: this app has one main task.

The initial visual concept included a map. The first implementation uses a clearly decorative parking illustration and hands navigation to Maps, avoiding a map-provider dependency and any suggestion of indoor routing.

## Data lifecycle

Only one active spot is retained. A new location cannot silently replace an active one. The user first finishes and confirms clearing the current spot. Storage writes must succeed before the interface claims success. If stored data cannot be loaded, the app blocks creation of a new spot and offers a retry.
