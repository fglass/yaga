# Repository Guidelines

## Project Structure & Module Organization

This project targets iOS only; do not add Android-specific code or configuration.

The Expo entry point lives in `App.tsx`, which wires `views/RootView` into the React Query provider. Feature-specific screens sit under `views/`, shared UI primitives belong in `components/`, and domain logic is grouped in `model/`. Static assets (fonts, icons, images) live in `assets/`, while `dist/` contains generated bundles—never edit files there directly.

Each screen owns a companion `viewModel` that gathers data from React Query, the SQLite layer, and any domain helpers before handing ready-to-render props down to the JSX. Place these in the same folder as their screen inside `views/`, and expose a hook like `useFeatureViewModel` whose return object (often consumed as `const vm = ...`) contains serializable state and callback handlers. `viewModel`s are responsible for orchestrating side-effects (mutations, navigation helpers, analytics) so components stay declarative and unit-testable; share common logic by delegating to modules in `model/` or `util.ts` rather than coupling screens together.

Use dependency injection (functional core, imperative shell) in view models. Suggestions:

-   Define a `deps` object in the hook and pass it into the core so tests can swap real IO/alerts/queries with fakes.
-   Keep the core module free of React hooks; accept `{ getState, setState, deps }` and return behavior methods.
-   Keep side effects (haptics, alerts, analytics) in the hook wrapper, not in the core.
-   In tests, build the core with a lightweight state harness so behavior can be exercised without React.

The `ios/` directory is treated as Expo-generated output. It is acceptable to regenerate it with `npx expo prebuild --platform ios --clean` when SDK or native module changes require it.

For Expo SDK or native module upgrades, always try a clean native regeneration first:

`npx expo prebuild --clean --platform ios` then `npx expo run:ios`

Only investigate or patch native/generated files after this flow has been attempted.

## UI Preferences

-   Always use haptics on confirmed user actions (e.g., save/delete), but not on every intermediate tap.

## Coding Style & Naming Conventions

Write all app code in TypeScript with ES modules. Follow 4-space indentation, single quotes inside JSX props when helpful, and trailing commas where Prettier places them. Components, hooks, and context providers use PascalCase file names (`WorkoutCard.tsx`), while helper modules stay camelCase. Prefer top-down file structure: export main functions near the top, then private helpers below.

Avoid deprecated APIs; prefer the current recommended methods in library docs.

Do not add periods to the end of single-line comments.

Always set an explicit timeout for outbound requests.

## Build, Test, and Development Commands

-   `npm start`: Launches Metro via `expo start` for rapid local iteration.
-   `npm run lint`: Runs ESLint across the TypeScript codebase.
-   `npm test`: Runs the Jest unit test suite.
-   `npx expo-doctor`: Runs the Expo doctor.

## Verification

-   Use the `ios-simulator-skill` to verify UI changes on the iOS simulator.
    -   For simulator launch/automation, use the iOS `bundleIdentifier` (`com.expench.yaga.development`).
    -   If a helper script reports that no simulator is booted or that the app is not installed, verify with direct `xcrun simctl` commands against the explicit booted UDID before concluding that the app is unavailable.
    -   If sandboxed simulator checks fail with `CoreSimulatorService` or similar connection errors, rerun the required `xcrun simctl` checks with escalation instead of treating the result as authoritative.
-   Always run `npm run lint` after making any change.

### Testing

-   Always run tests after making changes to confirm no regressions.
-   Add tests after adding features or fixing bugs. Only test meaningful behavior; do not add low-value tests.
-   Prefer single-responsibility tests; split large tests into focused cases and use parameterized tests where helpful.
-   Keep tests at the `viewModel` level; avoid UI/snapshot tests for this project.
