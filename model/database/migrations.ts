export const MIGRATIONS: string[] = [
    `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercise_defs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL,
        definition_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at INTEGER,
        finished_at INTEGER,
        distance REAL
    );

    CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        exercise_def_id TEXT NOT NULL REFERENCES exercise_defs(id),
        workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        notes_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS sets (
        id TEXT PRIMARY KEY,
        exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        weight TEXT NOT NULL DEFAULT '',
        reps TEXT NOT NULL DEFAULT '',
        finished_at INTEGER
    );
    `,
    `
    ALTER TABLE workouts
    ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}';

    UPDATE workouts
    SET metadata_json = '{}'
    WHERE metadata_json IS NULL OR metadata_json = '';
    `,
    `
    UPDATE workouts
    SET metadata_json = CASE
        WHEN json_valid(metadata_json) = 1
             AND json_type(metadata_json) = 'object'
            THEN json_set(
                metadata_json,
                '$.stravaActivityId',
                '0000000000000000000'
            )
        ELSE json_object('stravaActivityId', '0000000000000000000')
    END
    WHERE status = 'completed'
      AND type = 'run'
      AND (
        json_valid(metadata_json) = 0
        OR json_type(metadata_json) != 'object'
        OR json_extract(metadata_json, '$.stravaActivityId') IS NULL
      );
    `,
    `
    ALTER TABLE sets
    ADD COLUMN type TEXT NOT NULL DEFAULT 'default';
    `,
];
