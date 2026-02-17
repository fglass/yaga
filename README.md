# Yaga

Yet Another Gym App

```
expo update

npm start
npm test

npx expo prebuild --clean --platform ios
npx expo run:ios (dev client rebuild)

eas update
eas build --platform ios --profile development
eas build --platform ios --profile preview
```

## Release Roadmap

Target: **Mar 1** 🎯

### Milestone 1: Define scope + stabilize core (Jan 26 → Feb 1)

-   [x] Lock MVP scope
-   [x] Exercise def management (delete/merge/rename)
-   [x] History view bug fixes
-   [ ] Native UI refresh

### Milestone 2: Workout loop polish (Feb 2 → Feb 8)

-   [x] Bugs (see 🔴)
-   [x] Template execise setting
-   [x] Set types
-   [ ] ~~Rest timer noise~~
-   [ ] Rework exercise notes
-   [ ] RPE / RIR
-   [ ] ~~Advanced progressive overload calcs~~

### Milestone 3: Home + Plan + History clarity (Feb 9 → Feb 15)

-   [x] Tap for run count
-   [x] History view bug fixes
-   [ ] Active workout minimise
-   [ ] Jump to historical workout (via workout title or exercise history)
-   [ ] ~~Shake to undo~~

### Milestone 4: Data management (Feb 16 → Feb 22)

-   [ ] Seed exercise list
-   [ ] Cardio exercise?
-   [ ] CSV export
-   [ ] SQLite tests
-   [ ] SQLite import to new flow
-   [ ] Refine import flow
-   [ ] Sanity check SQLite + migrations
-   [ ] iCloud sync (defer if risky)

### Milestone 5: Ship (Feb 23 → Mar 1)

-   [ ] Bug bash
-   [ ] Settings view
-   [ ] CI/CD + EAS config sanity
-   [ ] Full test pass + lint clean
-   [ ] Release build + App Store prep

## Backlog

### General

-   [ ] 🟢 Sessions?
-   [ ] 🟡 iCloud sync
-   [ ] 🟡 Native UI refresh
-   [ ] 🟢 Native port?
-   [ ] 🟢 Goals: if X in Y then ✅
-   [ ] 🟡 Export CSV
-   [ ] 🟡 Settings view
-   [ ] 🟡 App log file
-   [ ] 🟡 Button haptics
-   [ ] 🟡 Toasts

### Home View

-   [ ] 🟢 Weekly targets?
-   [ ] 🟡 Tap for history chart
-   [ ] 🟡 Tap for run count
-   [ ] 🟢 Mindfulness
-   [ ] 🟢 Text init effect?

### Workout View

-   [ ] 🟢 Rest timer noise
-   [ ] 🟡 Exercise completion timer
-   [ ] 🟡 Set timer
-   [ ] 🟢 Drag to reorder exercises
-   [ ] 🟡 Active workout minimise
-   [ ] 🟡 Bug: Workout timer resets on app reopen
-   [ ] 🟢 Exercise history graph
-   [ ] 🟡 Jump to historical workout
-   [ ] 🟢 Exercise variations?
-   [ ] 🟡 Bug: Calories move goal
-   [ ] 🟢 Finish confetti/fireworks
-   [ ] 🟡 Seed from [exercise list](https://exrx.net/Lists/Directory)/similar
-   [ ] 🟡 Advanced progressive overload calcs
-   [ ] 🟡 RIR
-   [ ] 🟢 Cardio exercise?
-   [ ] 🟢 Shake to undo
-   [ ] 🟡 Touch workout title to see history
-   [ ] 🟡 Sticky exercise note
-   [ ] 🟡 Global-only exercise notes?
-   [ ] 🟡 Add exercise search
-   [ ] 🟡 Workout view model test coverage
-   [ ] 🟢 Supersets

### Run View

-   [ ] 🔴 Check: timer accuracy
-   [ ] 🟢 Display heart rate
-   [ ] 🟢 Strava shoe setting

### Plan View

-   [ ] 🟡 Template groups
-   [ ] 🟢 Template 'last done'

### History View

-   [ ]

### Import View

-   [ ] 🟡 Add SQLite import to new flow
-   [ ] 🟢 Merge/overwrite option
-   [ ] 🟢 Exercise category local classifier
-   [ ] 🟢 Map exercise keyboard
-   [ ] 🟢 Import exercise text clipping
-   [ ] 🟢 Tweak infer keywords
-   [ ] 🟢 Strong int conversion
-   [ ] 🟢 Strong notes?
-   [ ] 🟢 Strong warmup sets
-   [ ] 🟢 No history if mapped? Check
-   [ ] 🟢 Check history not overwritten
-   [ ] 🟢 Infer set types
-   [ ] 🔴 Bug: Lat pulldown missing?
-   [ ] 🔴 Remove exercise inferring?

## Incubator

-   Design:
    -   Accordians
    -   [Example](https://dribbble.com/shots/25596307-Workout-Tracker-Gym-App)
    -   [Palette](https://dribbble.com/shots/21782757-Wi-Fi-Scan-Diagnostics-app)
-   [iOS design](https://developer.apple.com/design/resources/)
-   Skills:
    -   https://github.com/expo/skills/tree/main/plugins/expo-app-design
    -   https://vercel.com/blog/introducing-react-best-practices

---

https://github.com/cameroncooke/XcodeBuildMCP

---

https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass
https://docs.expo.dev/versions/latest/sdk/glass-effect/

---

✨ AI

-   Require API key
-   Category inferring
-   Template creation
