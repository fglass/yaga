import { existsSync, unlinkSync } from "fs";

import type {
    CompletedWorkout,
    Exercise,
    ExerciseCategory,
    ExerciseDef,
    Note,
    Set as WorkoutSet,
    WorkoutMetadata,
    WorkoutTemplate,
    WorkoutType,
    SetType,
} from "../types";

import * as database from "./database";
import * as sqlite from "./sqlite";

type Db = Awaited<ReturnType<typeof sqlite.getDatabase>>;

type SeedExerciseDef = {
    id: string;
    def: ExerciseDef;
};

type SeedDatabaseParams = {
    exerciseDefs?: SeedExerciseDef[];
    completedWorkouts?: CompletedWorkout[];
    templates?: WorkoutTemplate[];
};

export const createTestDb = async <T>(
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

export const exerciseDefFactory = (
    name: string,
    category: ExerciseCategory = "Other"
): ExerciseDef => ({
    name,
    category,
});

export const exerciseFactory = (params: {
    id: string;
    exerciseId: string;
    notes?: Note[];
    sets?: WorkoutSet[];
}): Exercise => ({
    id: params.id,
    exerciseId: params.exerciseId,
    notes: params.notes ?? [],
    sets: params.sets ?? [],
});

export const setFactory = (params: {
    id: string;
    weight?: string;
    reps?: string;
    effortValue?: string;
    type?: SetType;
    finishTime?: number;
}): WorkoutSet => ({
    id: params.id,
    weight: params.weight ?? "",
    reps: params.reps ?? "",
    effortValue: params.effortValue ?? "",
    effortUnit: "rpe",
    type: params.type ?? "default",
    finishTime: params.finishTime,
});

export const workoutTemplateFactory = (params: {
    id: string;
    exerciseIds: string[];
    name?: string;
    notes?: string;
    type?: WorkoutType;
}): WorkoutTemplate => ({
    id: params.id,
    name: params.name ?? "Template",
    notes: params.notes ?? "",
    type: params.type ?? "strength",
    exercises: params.exerciseIds.map((exerciseId, index) =>
        exerciseFactory({
            id: `${params.id}-exercise-${index}`,
            exerciseId,
        })
    ),
});

export const completedWorkoutFactory = (params: {
    id: string;
    exerciseIds?: string[];
    exercises?: Exercise[];
    name?: string;
    notes?: string;
    type?: WorkoutType;
    startTimestamp?: number;
    endTimestamp?: number;
    distance?: number;
    metadata?: WorkoutMetadata;
}): CompletedWorkout => ({
    id: params.id,
    name: params.name ?? "Workout",
    notes: params.notes ?? "",
    type: params.type ?? "strength",
    exercises:
        params.exercises ??
        (params.exerciseIds ?? []).map((exerciseId, index) =>
            exerciseFactory({
                id: `${params.id}-exercise-${index}`,
                exerciseId,
            })
        ),
    metadata: params.metadata ?? {},
    startTimestamp: params.startTimestamp ?? 1,
    endTimestamp: params.endTimestamp ?? 2,
    distance: params.distance,
});

export const seedDatabase = async (
    db: Db,
    {
        exerciseDefs = [],
        completedWorkouts = [],
        templates = [],
    }: SeedDatabaseParams
) => {
    for (const { id, def } of exerciseDefs) {
        await db.runAsync(
            "INSERT OR REPLACE INTO exercise_defs (id, name, category) VALUES (?, ?, ?)",
            id,
            def.name,
            def.category
        );
    }

    for (const template of templates) {
        await db.runAsync(
            "INSERT OR REPLACE INTO templates (id, name, notes, type, definition_json) VALUES (?, ?, ?, ?, ?)",
            template.id,
            template.name,
            template.notes,
            template.type,
            JSON.stringify(template.exercises)
        );
    }

    for (const workout of completedWorkouts) {
        await db.runAsync(
            "INSERT OR REPLACE INTO workouts (id, name, notes, type, status, started_at, finished_at, distance, metadata_json) VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?)",
            workout.id,
            workout.name,
            workout.notes,
            workout.type,
            workout.startTimestamp,
            workout.endTimestamp,
            workout.distance ?? null,
            JSON.stringify(workout.metadata)
        );

        await db.runAsync(
            "DELETE FROM exercises WHERE workout_id = ?",
            workout.id
        );
        await insertExercises(db, workout.id, workout.exercises);
    }
};

export const fetchExerciseDefIds = async (db: Db, ids: string[]) => {
    return await db.getAllAsync<{ id: string }>(
        "SELECT id FROM exercise_defs WHERE id IN (?, ?)",
        ...ids
    );
};

export const fetchExerciseDefIdForExercise = async (
    db: Db,
    id: string
): Promise<string | undefined> => {
    const row = await db.getFirstAsync<{ exercise_def_id: string }>(
        "SELECT exercise_def_id FROM exercises WHERE id = ?",
        id
    );
    return row?.exercise_def_id;
};

export const fetchTemplateDefinition = async (
    db: Db,
    id: string
): Promise<Exercise[]> => {
    const row = await db.getFirstAsync<{ definition_json: string }>(
        "SELECT definition_json FROM templates WHERE id = ?",
        id
    );
    return JSON.parse(row?.definition_json ?? "[]") as Exercise[];
};

const cleanupDatabaseFiles = (dbName: string) => {
    const cleanupPaths = [dbName, `${dbName}-wal`, `${dbName}-shm`];
    for (const path of cleanupPaths) {
        if (existsSync(path)) {
            unlinkSync(path);
        }
    }
};

const insertExercises = async (
    db: Db,
    workoutId: string,
    exercises: Exercise[]
) => {
    for (
        let exerciseIdx = 0;
        exerciseIdx < exercises.length;
        exerciseIdx += 1
    ) {
        const exercise = exercises[exerciseIdx];
        await db.runAsync(
            "INSERT OR REPLACE INTO exercises (id, exercise_def_id, workout_id, position, notes_json) VALUES (?, ?, ?, ?, ?)",
            exercise.id,
            exercise.exerciseId,
            workoutId,
            exerciseIdx,
            JSON.stringify(exercise.notes)
        );

        for (let setIdx = 0; setIdx < exercise.sets.length; setIdx += 1) {
            const set = exercise.sets[setIdx];
            await db.runAsync(
                "INSERT OR REPLACE INTO sets (id, exercise_id, position, weight, reps, effort_value, effort_unit, type, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                set.id,
                exercise.id,
                setIdx,
                set.weight,
                set.reps,
                set.effortValue,
                set.effortUnit,
                set.type,
                set.finishTime ?? null
            );
        }
    }
};
