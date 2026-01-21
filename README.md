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
-   [ ] 🟢 iCloud sync?
-   [ ] 🟡 Liquid glass refresh
-   [ ] 🟢 Goals: if X in Y then ✅ 
-   [ ] 🟢 Native port
-   [ ] 🟢 CI/CD
-   [ ] 🟢 Release?

### Home View

-   [ ] 🟢 Weekly targets?
-   [ ] 🟡 Tap for history
-   [ ] 🟡 Tap for run count
-   [ ] 🟢 Mindfulness
- [ ] 🟢 Text init effect?


### Workout View

-   [ ] 🟡 New template adding
-   [ ] 🟢 Timer noise
-   [ ] 🟡 Exercise completion timer
-   [ ] 🟡 Drag to reorder exercises
-   [ ] 🟡 Active workout minimise
-   [ ] 🔴 Warmup/superset/ignore sets
-   [ ] 🟡 Bug: Workout timer resets on app reopen
-   [ ] 🟡 Exercise history graph
-   [ ] 🟡 Jump to historical workout
-   [ ] 🟡 Exercise variation?
-   [ ] 🟡 Bug: Calories move goal
-   [ ] 🟢 Finish confetti/fireworks
-   [ ] 🟢 Seed from [exercise list](https://exrx.net/Lists/Directory)/similar
-   [ ] 🟡 Sticky exercise note
-   [ ] 🟡 Advanced progressive overload calcs
-   [ ] 🟡 RIR
-   [ ] 🟡 Double tap to kb input weight/reps? Or adjust drag sensitivity
-   [ ] 🟢 Maintainability refactor
-   [ ] 🟢 Cardio exercise?
-   [ ] 🔴 Delete exercise def e.g. seated calf press, cable curl
-   [ ] 🔴 Merge exercise def
-   [ ] 🟢 Rename exercise def
-   [ ] 🟡 Shake to undo
-   [ ] 🔴 Bug: no delta with 0kg? E.g. pull up
-   [ ] 🔴 Bug: history view progressive overload
-   [ ] 🟡 Touch workout title to see history
-   [ ] 🟡 Rework exercise notes
-   [ ] 🔴 Bug: bottom timer clipping

### Run View

-   [ ] 🔴 Check: timer accuracy
-   [ ] 🟢 Display heart rate
-   [ ] 🟢 Strava shoe setting

### Plan View

-   [ ] 🟡 Template exercise setting
-   [ ] 🟡 Template last done

### History View

-   [ ] 🟡 Maybe: workout deletion bug

### Import View

-   [ ] 🟡 Add SQLite import
-   [ ] 🟢 Merge/overwrite option
- [ ] 🟢 Exercise category local classifier

## Incubator

-   Design:
    -   Accordians
    -   [Example](https://dribbble.com/shots/25596307-Workout-Tracker-Gym-App)
    -   [Palette](https://dribbble.com/shots/21782757-Wi-Fi-Scan-Diagnostics-app)
-   [iOS design](https://developer.apple.com/design/resources/)
    -   https://docs.expo.dev/router/advanced/native-tabs/
    -   https://docs.expo.dev/versions/latest/sdk/glass-effect/
- Skills:
    https://github.com/expo/skills/tree/main/plugins/expo-app-design
    https://vercel.com/blog/introducing-react-best-practices

---

Import:
Map exercise keyboard
Import exercise text clipping
Tweak infer keywords
Strong int conversion
Strong notes?
Strong warmup sets
No history if mapped? Check
Check history not overwritten
