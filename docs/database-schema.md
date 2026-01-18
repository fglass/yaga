# Database Schema Reference

This document mirrors the current SQLite schema for the app. It is for
reference only and is not used by runtime code.

## Tables

- schema_version: Tracks schema migrations applied by the app.
- exercise_defs: Exercise definition catalog.
- templates: Workout templates stored as JSON definitions.
- workouts: Active and completed workouts.
- exercises: Per-workout exercises, with note arrays stored as JSON.
- sets: Per-exercise sets.

## Notes

- `workouts.metadata_json` stores a JSON object for arbitrary metadata.
- JSON columns are stored as TEXT in SQLite and parsed by the app.
