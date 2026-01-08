# YAGA

Yet Another Gym App

```
expo update

npm start
npm test
npx expo run:ios

eas update
eas build --platform ios --profile development
eas build --platform ios --profile preview
```

## Backlog

### General

-   [ ] 🟢 Sessions?
-   [x] SQLite
-   [x] SQLite relational model
-   [x] Apple Health export
-   [x] Apple Health write toggle
-   [ ] 🟢 iCloud sync?
-   [x] Spreadsheet migration
-   [ ] 🟡 Strong migration
-   [x] Preview release
-   [x] Update splash image
-   [x] Test suite
-   [ ] 🟡 Liquid glass refresh
-   [ ] 🟢 Goal setting?
-   [ ] 🟢 Native port

### Home View

-   [x] Workouts per week/month/year
-   [x] Runs per week/month/year
-   [x] Apple Health read
-   [x] Distance stats
-   [ ] 🟢 Weekly targets?
-   [ ] 🟡 Tap for history

### Workout View

-   [x] Custom exercise
-   [x] Rest timer
-   [x] Notes
-   [x] Persistence
-   [x] Finishing
-   [x] Active workout
-   [x] Database export
-   [x] Set intervals
-   [x] Change set timer
-   [x] Exercise reordering
-   [x] Double tap "ditto"
-   [ ] 🟡 New template adding
-   [x] Timer notification
-   [ ] 🟢 Timer noise
-   [x] Sticky timer progress bar
-   [ ] 🟡 Exercise completion timer
-   [x] Disable exercise move above completed/active
-   [ ] 🟡 Drag to reorder exercises
-   [x] Set/time box colouring
-   [ ] 🟡 Active workout minimise
-   [ ] 🔴 Warmup/superset/ignore sets
-   [x] Bug: Keyboard position on bottom exercise
-   [x] Bug: Long exercise name hides buttons
-   [ ] 🟡 Bug: Workout timer resets on app reopen
-   [x] Exercise history
-   [ ] 🟡 Exercise history graph
-   [ ] 🟡 Jump to historical workout
-   [x] Go to history on workout close
-   [x] Exercise category dropdown
-   [ ] 🟡 Exercise variation?
-   [x] Finish workout confirmation
-   [ ] 🟡 Bug: Calories move goal
-   [ ] 🟢 Finish confetti/fireworks
-   [ ] 🟢 Seed from [exercise list](https://exrx.net/Lists/Directory)/similar
-   [ ] 🟡 Sticky exercise note
-   [ ] 🔴 Progressive overload tracker
-   [ ] 🟡 RIR
-   [ ] 🟡 Dedupe/delete exercise degs e.g. seated calf press, cable curl
-   [ ] 🟢 Double tap to kb input weight/reps? Or adjust drag sensitivity
-   [ ] 🔴 Bug: sometimes double rest timer (after adjust?)

### Run View

-   [x] Init
-   [x] Fix pace changing
-   [x] Pause run
-   [x] Pause run on finish
-   [x] Strava write
-   [x] Strava auth cache
-   [ ] 🔴 Check: timer accuracy
-   [ ] 🟢 Display heart rate
-   [ ] 🟢 Strava shoe setting
-   [x] Bug: Incorrect duration

### Plan View

-   [x] Workout list
-   [x] Workout creation
-   [x] Admin panel
-   [x] New run

### History View

-   [x] Show completed
-   [x] View completed
-   [x] Delete completed
-   [x] Apple Health read
-   [x] Dedupe
-   [ ] 🟡 Maybe: workout deletion bug

## Incubator

-   Design:
    -   Accordians
    -   [Example](https://dribbble.com/shots/25596307-Workout-Tracker-Gym-App)
    -   [Palette](https://dribbble.com/shots/21782757-Wi-Fi-Scan-Diagnostics-app)
-   [iOS design](https://developer.apple.com/design/resources/)
    -   https://docs.expo.dev/router/advanced/native-tabs/
    -   https://docs.expo.dev/versions/latest/sdk/glass-effect/
