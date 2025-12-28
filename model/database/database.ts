import { EXERCISE_DEFS, WORKOUT_TEMPLATES } from "./database.data";
import {
    CompletedWorkout,
    Exercise,
    ExerciseDef,
    Note,
    Set,
    Workout,
    WorkoutTemplate,
    WorkoutType,
} from "../types";
import { generateGuid, shareFile, withWarning } from "../../utils/util";
import { ensureDatabase, getDatabase, runInTransaction } from "./sqlite";

export enum QueryKey {
    Version = "version",
    ExerciseDefs = "exerciseDefs",
    Workouts = "workouts",
    ActiveWorkout = "activeWorkout",
    CompletedWorkouts = "completedWorkouts",
}

/* Global functions */

export const initDatabase = async () => {
    console.log("Initialising database...");
    await ensureDatabase();
    await seedInitialData();
};

export const exportDatabase = async () => {
    await ensureDatabase();
    const db = await getDatabase();
    const fileUri = db.databasePath.startsWith("file://")
        ? db.databasePath
        : `file://${db.databasePath}`;
    await shareFile(fileUri);
};

export const resetDatabase = () => {
    withWarning(async () => {
        await runInTransaction(async (db) => {
            await db.runAsync("DELETE FROM sets");
            await db.runAsync("DELETE FROM exercises");
            await db.runAsync("DELETE FROM workouts");
            await db.runAsync("DELETE FROM templates");
            await db.runAsync("DELETE FROM exercise_defs");
        });
        await seedInitialData();
        console.warn("Database reset");
    });
};

/* Write functions */

const seedInitialData = async () => {
    await ensureDatabase();

    await runInTransaction(async (dbTx) => {
        for (const [id, def] of Object.entries(EXERCISE_DEFS)) {
            await dbTx.runAsync(
                `INSERT OR REPLACE INTO exercise_defs (id, name, category)
                 VALUES (?, ?, ?)`,
                id,
                def.name,
                def.category
            );
        }

        for (const workout of WORKOUT_TEMPLATES) {
            await dbTx.runAsync(
                `INSERT OR REPLACE INTO templates
                 (id, name, notes, type, definition_json)
                 VALUES (?, ?, ?, ?, ?)`,
                workout.id,
                workout.name,
                workout.notes,
                workout.type,
                JSON.stringify(workout.exercises)
            );
        }
    });
};

export const createWorkoutTemplate = async (template: WorkoutTemplate) => {
    await ensureDatabase();

    const db = await getDatabase();
    await db.runAsync(
        `INSERT OR REPLACE INTO templates (id, name, notes, type, definition_json)
         VALUES (?, ?, ?, ?, ?)`,
        template.id,
        template.name,
        template.notes,
        template.type,
        JSON.stringify(template.exercises)
    );
};

export const saveActiveWorkout = async (workout: Workout | null) => {
    await ensureDatabase();

    if (workout == null) {
        await runInTransaction(async (db) => {
            await db.runAsync("DELETE FROM workouts WHERE status = 'active'");
        });
        return;
    }

    await runInTransaction(async (db) => {
        await db.runAsync(
            `INSERT OR REPLACE INTO workouts
             (id, name, notes, type, status, started_at, finished_at, distance)
             VALUES (?, ?, ?, ?, 'active', ?, NULL, ?)`,
            workout.id,
            workout.name,
            workout.notes,
            workout.type,
            workout.startTimestamp,
            workout.distance ?? null
        );

        await db.runAsync(
            "DELETE FROM workouts WHERE status = 'active' AND id != ?",
            workout.id
        );

        await db.runAsync(
            "DELETE FROM exercises WHERE workout_id = ?",
            workout.id
        );
        await insertExercises(db, workout.id, workout.exercises);
    });
};

const insertExercises = async (
    db: Awaited<ReturnType<typeof getDatabase>>,
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
            `INSERT OR REPLACE INTO exercises
             (id, exercise_def_id, workout_id, position, notes_json)
             VALUES (?, ?, ?, ?, ?)`,
            exercise.id,
            exercise.exerciseId,
            workoutId,
            exerciseIdx,
            JSON.stringify(exercise.notes)
        );

        for (let setIdx = 0; setIdx < exercise.sets.length; setIdx += 1) {
            const set = exercise.sets[setIdx];
            await db.runAsync(
                `INSERT OR REPLACE INTO sets
                 (id, exercise_id, position, weight, reps, finished_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                set.id,
                exercise.id,
                setIdx,
                set.weight,
                set.reps,
                set.finishTime ?? null
            );
        }
    }
};

export const completeWorkout = async (workout: CompletedWorkout) => {
    await ensureDatabase();

    await runInTransaction(async (db) => {
        await db.runAsync(
            `INSERT OR REPLACE INTO workouts
             (id, name, notes, type, status, started_at, finished_at, distance)
             VALUES (?, ?, ?, ?, 'completed', ?, ?, ?)`,
            workout.id,
            workout.name,
            workout.notes,
            workout.type,
            workout.startTimestamp,
            workout.endTimestamp,
            workout.distance ?? null
        );

        await db.runAsync(
            "DELETE FROM exercises WHERE workout_id = ?",
            workout.id
        );
        await insertExercises(db, workout.id, workout.exercises);
    });
};

export const deleteCompletedWorkout = async (workoutId: string) => {
    await ensureDatabase();

    await runInTransaction(async (db) => {
        await db.runAsync(
            "DELETE FROM sets WHERE exercise_id IN (SELECT id FROM exercises WHERE workout_id = ?)",
            workoutId
        );
        await db.runAsync(
            "DELETE FROM exercises WHERE workout_id = ?",
            workoutId
        );
        await db.runAsync(
            "DELETE FROM workouts WHERE id = ? AND status = 'completed'",
            workoutId
        );
    });
};

export const createExerciseDef = async (def: ExerciseDef): Promise<string> => {
    await ensureDatabase();

    const db = await getDatabase();
    const exerciseId = generateGuid();

    await db.runAsync(
        `INSERT OR REPLACE INTO exercise_defs (id, name, category)
         VALUES (?, ?, ?)`,
        exerciseId,
        def.name,
        def.category
    );
    return exerciseId;
};

/* Read operations */

export const fetchExerciseDefs = async (): Promise<
    Record<string, ExerciseDef>
> => {
    await ensureDatabase();
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
        id: string;
        name: string;
        category: string;
    }>("SELECT id, name, category FROM exercise_defs ORDER BY name");
    return rows.reduce<Record<string, ExerciseDef>>((acc, row) => {
        acc[row.id] = { name: row.name, category: row.category };
        return acc;
    }, {});
};

export const fetchWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
    await ensureDatabase();
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
        id: string;
        name: string;
        notes: string;
        type: WorkoutType;
        definition_json: string;
    }>(
        "SELECT id, name, notes, type, definition_json FROM templates ORDER BY rowid"
    );

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        notes: row.notes,
        type: row.type,
        exercises: parseDefinitionJson(row.definition_json),
    }));
};

export const fetchActiveWorkout = async (): Promise<Workout | null> => {
    await ensureDatabase();
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
        id: string;
        name: string;
        notes: string;
        type: WorkoutType;
        started_at: number;
        distance: number | null;
    }>(
        "SELECT id, name, notes, type, distance, started_at FROM workouts WHERE status = 'active' LIMIT 1"
    );

    if (!row) {
        return null;
    }

    const exercises = await fetchExercisesForWorkout(db, row.id);
    return {
        id: row.id,
        name: row.name,
        notes: row.notes,
        type: row.type,
        exercises,
        startTimestamp: row.started_at,
        distance: row.distance ?? undefined,
    };
};

const fetchExercisesForWorkout = async (
    db: Awaited<ReturnType<typeof getDatabase>>,
    workoutId: string
): Promise<Exercise[]> => {
    const exerciseRows = await db.getAllAsync<{
        id: string;
        exercise_def_id: string;
        position: number;
        notes_json: string;
    }>(
        "SELECT id, exercise_def_id, position, notes_json FROM exercises WHERE workout_id = ? ORDER BY position",
        workoutId
    );

    const exercises = await Promise.all(
        exerciseRows.map(async (exerciseRow) => {
            const setRows = await db.getAllAsync<{
                id: string;
                position: number;
                weight: string;
                reps: string;
                finished_at: number | null;
            }>(
                "SELECT id, position, weight, reps, finished_at FROM sets WHERE exercise_id = ? ORDER BY position",
                exerciseRow.id
            );

            const sets = setRows.map(
                (setRow) =>
                    ({
                        id: setRow.id,
                        weight: setRow.weight,
                        reps: setRow.reps,
                        finishTime: setRow.finished_at ?? undefined,
                    } as Set)
            );

            return {
                id: exerciseRow.id,
                exerciseId: exerciseRow.exercise_def_id,
                notes: parseNotesJson(exerciseRow.notes_json),
                sets,
            } as Exercise;
        })
    );

    return exercises;
};

export const fetchCompletedWorkouts = async (): Promise<CompletedWorkout[]> => {
    await ensureDatabase();

    const db = await getDatabase();
    const rows = await db.getAllAsync<{
        id: string;
        name: string;
        notes: string;
        type: WorkoutType;
        distance: number | null;
        started_at: number;
        finished_at: number | null;
    }>(
        "SELECT id, name, notes, type, distance, started_at, finished_at FROM workouts WHERE status = 'completed'"
    );

    const completed = await Promise.all(
        rows.map(async (row) => {
            const exercises = await fetchExercisesForWorkout(db, row.id);
            return {
                id: row.id,
                name: row.name,
                notes: row.notes,
                type: row.type,
                exercises,
                distance: row.distance ?? undefined,
                startTimestamp: row.started_at,
                endTimestamp: row.finished_at ?? 0,
            } as CompletedWorkout;
        })
    );

    return completed;
};

export const fetchRecentSetsForExercises = async (
    exerciseIds: string[],
    nWorkouts: number
): Promise<Record<string, { finishedAt: number; sets: Set[] }[]>> => {
    await ensureDatabase();

    if (exerciseIds.length === 0 || nWorkouts <= 0) {
        return {};
    }

    const db = await getDatabase();

    const placeholders = exerciseIds.map(() => "?").join(", ");
    const rows = await db.getAllAsync<{
        exercise_id: string;
        exercise_def_id: string;
        workout_finished_at: number | null;
        set_id: string | null;
        position: number | null;
        weight: string | null;
        reps: string | null;
        set_finished_at: number | null;
    }>(
        `SELECT exercises.id as exercise_id,
                exercises.exercise_def_id as exercise_def_id,
                workouts.finished_at as workout_finished_at,
                sets.id as set_id,
                sets.position as position,
                sets.weight as weight,
                sets.reps as reps,
                sets.finished_at as set_finished_at
         FROM exercises
         JOIN workouts ON workouts.id = exercises.workout_id
         LEFT JOIN sets ON sets.exercise_id = exercises.id
         WHERE workouts.status = 'completed'
         AND exercises.exercise_def_id IN (${placeholders})
         ORDER BY workouts.finished_at DESC, exercises.id, sets.position`,
        ...exerciseIds
    );

    if (rows.length === 0) {
        return {};
    }

    const result: Record<string, { finishedAt: number; sets: Set[] }[]> = {};
    const entriesByExercise = new Map<
        string,
        { finishedAt: number; sets: Set[] }
    >();

    for (const row of rows) {
        const exerciseDefId = row.exercise_def_id;
        const exerciseId = row.exercise_id;
        let entry = entriesByExercise.get(exerciseId);

        if (!entry) {
            if (!result[exerciseDefId]) {
                result[exerciseDefId] = [];
            }
            if (result[exerciseDefId].length >= nWorkouts) {
                continue;
            }
            entry = {
                finishedAt: row.workout_finished_at ?? 0,
                sets: [],
            };
            result[exerciseDefId].push(entry);
            entriesByExercise.set(exerciseId, entry);
        }

        if (row.set_id) {
            entry.sets.push({
                id: row.set_id,
                weight: row.weight ?? "",
                reps: row.reps ?? "",
                finishTime: row.set_finished_at ?? undefined,
            });
        }
    }

    return result;
};

/* Helpers */

const parseNotesJson = (raw: string): Note[] => {
    try {
        const parsed = JSON.parse(raw);
        return parsed;
    } catch (error) {
        console.warn("Failed to parse notes JSON", error);
        return [];
    }
};

const parseDefinitionJson = (raw: string): Exercise[] => {
    try {
        const parsed = JSON.parse(raw);
        return parsed;
    } catch (error) {
        console.warn("Failed to parse definition JSON", error);
        return [];
    }
};
