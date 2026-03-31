import { createTestDb } from "../database.test.helpers";

describe("database migrations", () => {
    it("backfills legacy completed runs with fake strava IDs", async () => {
        await createTestDb(async (_database, sqlite) => {
            const db = await sqlite.getDatabase();

            await db.runAsync(
                "INSERT INTO workouts (id, name, notes, type, status, started_at, finished_at, distance, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "run-no-id",
                "Legacy Run",
                "",
                "run",
                "completed",
                1000,
                2000,
                5,
                "{}"
            );

            await db.runAsync(
                "INSERT INTO workouts (id, name, notes, type, status, started_at, finished_at, distance, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "run-existing-id",
                "Existing Synced Run",
                "",
                "run",
                "completed",
                3000,
                4000,
                6,
                '{"stravaActivityId":"12345"}'
            );

            await db.runAsync(
                "INSERT INTO workouts (id, name, notes, type, status, started_at, finished_at, distance, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "strength-no-id",
                "Legacy Strength",
                "",
                "strength",
                "completed",
                5000,
                6000,
                null,
                "{}"
            );
            await db.runAsync("DROP TABLE IF EXISTS sets");
            await db.runAsync(
                `CREATE TABLE sets (
                    id TEXT PRIMARY KEY,
                    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
                    position INTEGER NOT NULL,
                    weight TEXT NOT NULL DEFAULT '',
                    reps TEXT NOT NULL DEFAULT '',
                    finished_at INTEGER
                )`
            );

            await db.runAsync("DELETE FROM schema_version");
            await db.runAsync(
                "INSERT INTO schema_version (version) VALUES (?)",
                2
            );

            await sqlite.resetDatabaseConnection();
            await sqlite.ensureDatabase();

            const migratedDb = await sqlite.getDatabase();
            const rows = await migratedDb.getAllAsync<{
                id: string;
                strava_activity_id: string | null;
            }>(
                `SELECT id,
                        json_extract(metadata_json, '$.stravaActivityId') as strava_activity_id
                 FROM workouts
                 WHERE id IN (?, ?, ?)`,
                "run-no-id",
                "run-existing-id",
                "strength-no-id"
            );

            const byId = rows.reduce<Record<string, string | null>>(
                (acc, row) => {
                    acc[row.id] = row.strava_activity_id;
                    return acc;
                },
                {}
            );

            expect(byId["run-no-id"]).toBe("0000000000000000000");
            expect(byId["run-existing-id"]).toBe("12345");
            expect(byId["strength-no-id"]).toBeNull();
        });
    });

    it("backfills legacy sets with default type", async () => {
        await createTestDb(async (_database, sqlite) => {
            const db = await sqlite.getDatabase();

            await db.runAsync("DROP TABLE IF EXISTS sets");
            await db.runAsync(
                `CREATE TABLE sets (
                    id TEXT PRIMARY KEY,
                    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
                    position INTEGER NOT NULL,
                    weight TEXT NOT NULL DEFAULT '',
                    reps TEXT NOT NULL DEFAULT '',
                    finished_at INTEGER
                )`
            );
            await db.runAsync(
                "INSERT OR REPLACE INTO exercise_defs (id, name, category) VALUES (?, ?, ?)",
                "legacy-def",
                "Legacy Exercise",
                "Other"
            );
            await db.runAsync(
                "INSERT OR REPLACE INTO workouts (id, name, notes, type, status, started_at, finished_at, distance, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "legacy-workout",
                "Legacy Workout",
                "",
                "strength",
                "completed",
                1,
                2,
                null,
                "{}"
            );
            await db.runAsync(
                "INSERT OR REPLACE INTO exercises (id, exercise_def_id, workout_id, position, notes_json) VALUES (?, ?, ?, ?, ?)",
                "legacy-exercise",
                "legacy-def",
                "legacy-workout",
                0,
                "[]"
            );
            await db.runAsync(
                "INSERT INTO sets (id, exercise_id, position, weight, reps, finished_at) VALUES (?, ?, ?, ?, ?, ?)",
                "legacy-set",
                "legacy-exercise",
                0,
                "100",
                "5",
                1
            );

            await db.runAsync("DELETE FROM schema_version");
            await db.runAsync(
                "INSERT INTO schema_version (version) VALUES (?)",
                3
            );

            await sqlite.resetDatabaseConnection();
            await sqlite.ensureDatabase();

            const migratedDb = await sqlite.getDatabase();
            const row = await migratedDb.getFirstAsync<{
                type: string;
                effort_value: string;
                effort_unit: string;
            }>(
                "SELECT type, effort_value, effort_unit FROM sets WHERE id = ?",
                "legacy-set"
            );

            expect(row?.type).toBe("default");
            expect(row?.effort_value).toBe("");
            expect(row?.effort_unit).toBe("rpe");
        });
    });
});
