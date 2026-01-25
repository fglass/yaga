import { existsSync, unlinkSync } from "fs";

import type { Exercise, ExerciseDef, WorkoutTemplate } from "../../types";

import * as database from "../database";
import * as sqlite from "../sqlite";

type Db = Awaited<ReturnType<typeof sqlite.getDatabase>>;

const cleanupDatabaseFiles = (dbName: string) => {
    const cleanupPaths = [dbName, `${dbName}-wal`, `${dbName}-shm`];
    for (const path of cleanupPaths) {
        if (existsSync(path)) {
            unlinkSync(path);
        }
    }
};

const createTestDb = async <T>(
    run: (db: typeof database, sqliteModule: typeof sqlite) => Promise<T>
) => {
    const workerId = process.env.JEST_WORKER_ID ?? "0";
    const dbName = `test-${workerId}-${Date.now()}-${Math.random()}.db`;
    process.env.EXPO_SQLITE_MOCK = dbName;
    await sqlite.setDatabaseNameForTests(dbName);
    await database.initDatabase();
    try {
        return await run(database, sqlite);
    } finally {
        await sqlite.resetDatabaseConnection();
        delete process.env.EXPO_SQLITE_MOCK;
        cleanupDatabaseFiles(dbName);
    }
};

const workoutTemplateFactory = (exerciseIds: string[]): WorkoutTemplate => ({
    id: `template-${Date.now()}-${Math.random()}`,
    name: "Template",
    notes: "",
    type: "strength",
    exercises: exerciseIds.map((exerciseId, index) => ({
        id: `exercise-${index}-${Date.now()}`,
        exerciseId,
        notes: [],
        sets: [],
    })),
});

const exerciseDefFactory = (name: string): ExerciseDef => ({
    name,
    category: "Other",
});

const insertWorkout = async (
    db: Db,
    params: {
        id: string;
        name: string;
        notes?: string;
        type: string;
        status: string;
    }
) => {
    await db.runAsync(
        "INSERT INTO workouts (id, name, notes, type, status) VALUES (?, ?, ?, ?, ?)",
        params.id,
        params.name,
        params.notes ?? "",
        params.type,
        params.status
    );
};

const insertExercise = async (
    db: Db,
    params: {
        id: string;
        exerciseDefId: string;
        workoutId: string;
        position: number;
        notesJson?: string;
    }
) => {
    await db.runAsync(
        "INSERT INTO exercises (id, exercise_def_id, workout_id, position, notes_json) VALUES (?, ?, ?, ?, ?)",
        params.id,
        params.exerciseDefId,
        params.workoutId,
        params.position,
        params.notesJson ?? "[]"
    );
};

const fetchExerciseDefIds = async (
    db: Db,
    ids: string[]
) => {
    return await db.getAllAsync<{ id: string }>(
        "SELECT id FROM exercise_defs WHERE id IN (?, ?)",
        ...ids
    );
};

const fetchExerciseDefIdForExercise = async (
    db: Db,
    id: string
) => {
    return await db.getAllAsync<{ exercise_def_id: string }>(
        "SELECT exercise_def_id FROM exercises WHERE id = ?",
        id
    );
};

const fetchTemplateDefinition = async (
    db: Db,
    id: string
) => {
    return await db.getFirstAsync<{ definition_json: string }>(
        "SELECT definition_json FROM templates WHERE id = ?",
        id
    );
};

describe("database exercise defs", () => {
    it("deleteExerciseDef reassigns exercises and removes from templates", async () => {
        await createTestDb(async (database, sqlite) => {
            const defA = await database.createExerciseDef(
                exerciseDefFactory("Exercise A")
            );
            const defB = await database.createExerciseDef(
                exerciseDefFactory("Exercise B")
            );

            const db = await sqlite.getDatabase();
            const workoutId = "workout-1";
            await insertWorkout(db, {
                id: workoutId,
                name: "Workout",
                type: "strength",
                status: "active",
            });
            await insertExercise(db, {
                id: "exercise-1",
                exerciseDefId: defA,
                workoutId,
                position: 0,
            });

            const template = workoutTemplateFactory([defA, defB]);
            await database.createWorkoutTemplate(template);

            const unknownId = await database.deleteExerciseDef(defA);

            const remainingDefs = await fetchExerciseDefIds(db, [defA, defB]);
            expect(remainingDefs.map((row) => row.id)).toEqual([defB]);

            const reassigned = await fetchExerciseDefIdForExercise(
                db,
                "exercise-1"
            );
            expect(reassigned[0].exercise_def_id).toBe(unknownId);

            const templateRow = await fetchTemplateDefinition(db, template.id);
            const parsed = JSON.parse(
                templateRow?.definition_json ?? "[]"
            ) as Exercise[];
            expect(
                parsed.some((exercise) => exercise.exerciseId === defA)
            ).toBe(false);
        });
    });

    it("mergeExerciseDefs reassigns exercises and templates", async () => {
        await createTestDb(async (database, sqlite) => {
            const defA = await database.createExerciseDef(
                exerciseDefFactory("Exercise A")
            );
            const defB = await database.createExerciseDef(
                exerciseDefFactory("Exercise B")
            );
            const defC = await database.createExerciseDef(
                exerciseDefFactory("Exercise C")
            );

            const db = await sqlite.getDatabase();
            const workoutId = "workout-2";
            await insertWorkout(db, {
                id: workoutId,
                name: "Workout",
                type: "strength",
                status: "active",
            });
            await insertExercise(db, {
                id: "exercise-2",
                exerciseDefId: defA,
                workoutId,
                position: 0,
            });

            const template = workoutTemplateFactory([defA, defB, defA, defC]);
            await database.createWorkoutTemplate(template);

            await database.mergeExerciseDefs(defB, [defA]);

            const reassigned = await fetchExerciseDefIdForExercise(
                db,
                "exercise-2"
            );
            expect(reassigned[0].exercise_def_id).toBe(defB);

            const templateRow = await fetchTemplateDefinition(db, template.id);
            const parsed = JSON.parse(
                templateRow?.definition_json ?? "[]"
            ) as Exercise[];
            const ids = parsed.map((exercise) => exercise.exerciseId);
            expect(ids.includes(defA)).toBe(false);
            expect(ids.filter((id) => id === defB)).toHaveLength(3);
            expect(ids.includes(defC)).toBe(true);
        });
    });

    it("mergeExerciseDefs updates templates even when length stays the same", async () => {
        await createTestDb(async (database, sqlite) => {
            const defA = await database.createExerciseDef(
                exerciseDefFactory("Exercise A")
            );
            const defB = await database.createExerciseDef(
                exerciseDefFactory("Exercise B")
            );

            const template = workoutTemplateFactory([defA]);
            await database.createWorkoutTemplate(template);

            await database.mergeExerciseDefs(defB, [defA]);

            const db = await sqlite.getDatabase();
            const templateRow = await fetchTemplateDefinition(db, template.id);
            const parsed = JSON.parse(
                templateRow?.definition_json ?? "[]"
            ) as Exercise[];
            const ids = parsed.map((exercise) => exercise.exerciseId);
            expect(ids).toEqual([defB]);
        });
    });
});
