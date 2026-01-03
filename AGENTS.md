# Repository Guidelines

## Project Structure & Module Organization

The Expo entry point lives in `App.tsx`, which wires `views/RootView` into the React Query provider. Feature-specific screens sit under `views/`, shared UI primitives belong in `components/`, and domain logic is grouped in `model/` and `util.ts`. Static assets (fonts, icons, images) live in `assets/`, while `dist/` contains generated bundles—never edit files there directly. Keep SQLite schemas and migrations colocated with the modules that depend on them so DB changes ship with their owning feature.

Each screen owns a companion viewModel that gathers data from React Query, the SQLite layer, and any domain helpers before handing ready-to-render props down to the JSX. Place these in the same folder as their screen inside `views/`, name the module `viewModel.ts`, and expose a hook like `useFeatureViewModel` whose return object (often consumed as `const vm = ...`) contains serializable state and callback handlers. ViewModels are responsible for orchestrating side-effects (mutations, navigation helpers, analytics) so components stay declarative and unit-testable; share common logic by delegating to modules in `model/` or `util.ts` rather than coupling screens together.

## Build, Test, and Development Commands

-   `npm start`: Launches Metro via `expo start` for rapid local iteration; use the QR code or simulator buttons to attach clients.
-   `npx expo-doctor`: Sanity-checks the workspace after dependency updates.

## Coding Style & Naming Conventions

Write all app code in TypeScript with ES modules. Follow 4-space indentation, single quotes inside JSX props when helpful, and trailing commas where Prettier places them. Components, hooks, and context providers use PascalCase file names (`WorkoutCard.tsx`), while helper modules stay camelCase. Prefer top-down file structure: export main functions near the top, then private helpers below.

Avoid deprecated APIs; prefer the current recommended methods in library docs.
