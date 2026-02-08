import {
    EXERCISE_DEFS,
    UNKNOWN_EXERCISE_DEF_ID,
    WORKOUT_TEMPLATES,
} from "./database.data";
import {
    CompletedWorkout,
    Exercise,
    ExerciseCategory,
    ExerciseDef,
    Note,
    Set,
    SetType,
    Workout,
    WorkoutMetadata,
    WorkoutTemplate,
    WorkoutType,
} from "../types";
import * as DocumentPicker from "expo-document-picker";
import { File as ExpoFile } from "expo-file-system";
import type * as SQLite from "expo-sqlite";
import { shareFile, withWarning } from "../../utils/util";
import { generateGuid } from "../../utils/guid";
import {
    ensureDatabase,
    getDatabase,
    resetDatabaseConnection,
    runInTransaction,
} from "./sqlite";

export enum QueryKey {
    Version = "version",
    ExerciseDefs = "exerciseDefs",
    Workouts = "workouts",
    ActiveWorkout = "activeWorkout",
    CompletedWorkouts = "completedWorkouts",
}

/* Global functions */

export const initDatabase = async () => {
    const startTime = Date.now();
    await ensureDatabase();
    await seedInitialData();
    console.log(`Database initialised in ${Date.now() - startTime}ms`);
};

export const exportDatabase = async () => {
    await ensureDatabase();
    const db = await getDatabase();
    const fileUri = db.databasePath.startsWith("file://")
        ? db.databasePath
        : `file://${db.databasePath}`;
    await shareFile(fileUri);
};

export const importDatabase = () => {
    withWarning(async () => {
        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            return;
        }

        const file = result.assets?.[0];
        if (!file?.uri) {
            return;
        }

        const db = await getDatabase();
        const destUri = db.databasePath.startsWith("file://")
            ? db.databasePath
            : `file://${db.databasePath}`;

        void resetDatabaseConnection();
        const sourceFile = new ExpoFile(file.uri);
        const destFile = new ExpoFile(destUri);

        const sourceStream = sourceFile.readableStream();
        const destStream = destFile.writableStream();
        await sourceStream.pipeTo(destStream);

        await ensureDatabase();

        console.log(`Database imported from ${file.name}`);
        alert("Database import successful");
    });
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
        alert("Database reset successful");
    });
};

/* Write functions */

const seedInitialData = async () => {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM exercise_defs"
    );
    if ((existing?.count ?? 0) > 0) {
        return;
    }
    console.log("Seeding initial data...");
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

export const deleteWorkoutTemplate = async (templateId: string) => {
    await ensureDatabase();

    const db = await getDatabase();
    await db.runAsync("DELETE FROM templates WHERE id = ?", templateId);
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
             (id, name, notes, type, status, started_at, finished_at, distance, metadata_json)
             VALUES (?, ?, ?, ?, 'active', ?, NULL, ?, ?)`,
            workout.id,
            workout.name,
            workout.notes,
            workout.type,
            workout.startTimestamp,
            workout.distance ?? null,
            JSON.stringify(workout.metadata)
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
                 (id, exercise_id, position, weight, reps, type, finished_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                set.id,
                exercise.id,
                setIdx,
                set.weight,
                set.reps,
                set.type,
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
             (id, name, notes, type, status, started_at, finished_at, distance, metadata_json)
             VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?)`,
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

export const updateExerciseDef = async (params: {
    id: string;
    def: ExerciseDef;
}): Promise<void> => {
    await ensureDatabase();

    const db = await getDatabase();
    await db.runAsync(
        "UPDATE exercise_defs SET name = ?, category = ? WHERE id = ?",
        params.def.name,
        params.def.category,
        params.id
    );
};

export const deleteExerciseDef = async (
    exerciseDefId: string
): Promise<string> => {
    await ensureDatabase();
    const startTime = Date.now();

    return await runInTransaction(async (db) => {
        const unknownId = UNKNOWN_EXERCISE_DEF_ID;

        // Never delete the sentinel
        if (exerciseDefId === unknownId) {
            return unknownId;
        }

        // Reassign existing workout exercises to the sentinel
        await db.runAsync(
            "UPDATE exercises SET exercise_def_id = ? WHERE exercise_def_id = ?",
            unknownId,
            exerciseDefId
        );

        // Remove the exercise from templates entirely.
        await updateTemplateDefinitions(db, (exercise) =>
            exercise.exerciseId === exerciseDefId ? null : exercise
        );

        // Delete the exercise definition itself
        await db.runAsync(
            "DELETE FROM exercise_defs WHERE id = ?",
            exerciseDefId
        );

        console.log(`Exercise def deleted in ${Date.now() - startTime}ms`);
        return unknownId;
    });
};

export const mergeExerciseDefs = async (
    targetExerciseDefId: string,
    sourceExerciseDefIds: string[]
): Promise<void> => {
    await ensureDatabase();

    const sources = sourceExerciseDefIds.filter(
        (id): id is string => Boolean(id) && id !== targetExerciseDefId
    );
    if (sources.length === 0) {
        return;
    }

    await runInTransaction(async (db) => {
        // Reassign existing workout exercises to the target def
        await db.runAsync(
            `UPDATE exercises
             SET exercise_def_id = ?
             WHERE exercise_def_id IN (${sources.map(() => "?").join(",")})`,
            targetExerciseDefId,
            ...sources
        );

        await updateTemplateDefinitions(db, (exercise) =>
            sources.includes(exercise.exerciseId)
                ? { ...exercise, exerciseId: targetExerciseDefId }
                : exercise
        );

        // Delete merged exercise definitions
        await db.runAsync(
            `DELETE FROM exercise_defs WHERE id IN (${sources
                .map(() => "?")
                .join(",")})`,
            ...sources
        );
    });
};

/* Read operations */

export const fetchExerciseDefs = async (): Promise<
    Record<string, ExerciseDef>
> => {
    const startTime = Date.now();
    await ensureDatabase();

    const db = await getDatabase();
    const rows = await db.getAllAsync<{
        id: string;
        name: string;
        category: ExerciseCategory;
    }>("SELECT id, name, category FROM exercise_defs ORDER BY name");
    const defs = rows.reduce<Record<string, ExerciseDef>>((acc, row) => {
        acc[row.id] = { name: row.name, category: row.category };
        return acc;
    }, {});

    console.log(`Exercise defs fetched in ${Date.now() - startTime}ms`);
    return defs;
};

export const fetchCompletedWorkoutKeys = async (): Promise<string[]> => {
    const startTime = Date.now();
    await ensureDatabase();

    const db = await getDatabase();
    const rows = await db.getAllAsync<{
        name: string;
        started_at: number;
    }>("SELECT name, started_at FROM workouts WHERE status = 'completed'");

    const keys = rows.map((row) => `${row.name}__${row.started_at}`);

    console.log(
        `Completed workout keys fetched in ${Date.now() - startTime}ms`
    );
    return keys;
};

export const fetchCompletedWorkoutIds = async (): Promise<string[]> => {
    const startTime = Date.now();
    await ensureDatabase();

    const db = await getDatabase();
    const rows = await db.getAllAsync<{ id: string }>(
        "SELECT id FROM workouts WHERE status = 'completed'"
    );
    const ids = rows.map((row) => row.id);

    console.log(`Completed workout IDs fetched in ${Date.now() - startTime}ms`);
    return ids;
};

export const fetchWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
    const startTime = Date.now();
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

    const templates = rows.map((row) => ({
        id: row.id,
        name: row.name,
        notes: row.notes,
        type: row.type,
        exercises: parseDefinitionJson(row.definition_json),
    }));

    console.log(`Workout templates fetched in ${Date.now() - startTime}ms`);
    return templates;
};

export const fetchActiveWorkout = async (): Promise<Workout | null> => {
    const startTime = Date.now();
    await ensureDatabase();

    const db = await getDatabase();
    const row = await db.getFirstAsync<{
        id: string;
        name: string;
        notes: string;
        type: WorkoutType;
        started_at: number;
        distance: number | null;
        metadata_json: string;
    }>(
        "SELECT id, name, notes, type, distance, started_at, metadata_json FROM workouts WHERE status = 'active' LIMIT 1"
    );

    if (!row) {
        console.log(`Active workout fetched in ${Date.now() - startTime}ms`);
        return null;
    }

    const exercises = await fetchExercisesForWorkout(db, row.id);

    console.log(`Active workout fetched in ${Date.now() - startTime}ms`);
    return {
        id: row.id,
        name: row.name,
        notes: row.notes,
        type: row.type,
        exercises,
        metadata: parseMetadataJson(row.metadata_json),
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
                type: SetType;
                finished_at: number | null;
            }>(
                "SELECT id, position, weight, reps, type, finished_at FROM sets WHERE exercise_id = ? ORDER BY position",
                exerciseRow.id
            );

            const sets = setRows.map(
                (setRow) =>
                    ({
                        id: setRow.id,
                        weight: setRow.weight,
                        reps: setRow.reps,
                        type: setRow.type,
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
    const startTime = Date.now();
    await ensureDatabase();

    const db = await getDatabase();

    // Single join + in-memory grouping to avoid N+1 queries
    const rows = await db.getAllAsync<{
        workout_id: string;
        workout_name: string;
        workout_notes: string;
        workout_type: WorkoutType;
        workout_distance: number | null;
        workout_started_at: number;
        workout_finished_at: number | null;
        workout_metadata_json: string;
        exercise_id: string | null;
        exercise_def_id: string | null;
        exercise_position: number | null;
        exercise_notes_json: string | null;
        set_id: string | null;
        set_position: number | null;
        set_weight: string | null;
        set_reps: string | null;
        set_type: SetType;
        set_finished_at: number | null;
    }>(
        `SELECT workouts.id as workout_id,
                workouts.name as workout_name,
                workouts.notes as workout_notes,
                workouts.type as workout_type,
                workouts.distance as workout_distance,
                workouts.started_at as workout_started_at,
                workouts.finished_at as workout_finished_at,
                workouts.metadata_json as workout_metadata_json,
                exercises.id as exercise_id,
                exercises.exercise_def_id as exercise_def_id,
                exercises.position as exercise_position,
                exercises.notes_json as exercise_notes_json,
                sets.id as set_id,
                sets.position as set_position,
                sets.weight as set_weight,
                sets.reps as set_reps,
                sets.type as set_type,
                sets.finished_at as set_finished_at
         FROM workouts
         LEFT JOIN exercises ON exercises.workout_id = workouts.id
         LEFT JOIN sets ON sets.exercise_id = exercises.id
         WHERE workouts.status = 'completed'
         ORDER BY workouts.finished_at DESC, exercises.position, sets.position`
    );

    const workoutMap = new Map<string, CompletedWorkout>();
    const exerciseMap = new Map<string, Exercise>();

    for (const row of rows) {
        let workout = workoutMap.get(row.workout_id);
        if (!workout) {
            workout = {
                id: row.workout_id,
                name: row.workout_name,
                notes: row.workout_notes,
                type: row.workout_type,
                exercises: [],
                distance: row.workout_distance ?? undefined,
                metadata: parseMetadataJson(row.workout_metadata_json),
                startTimestamp: row.workout_started_at,
                endTimestamp: row.workout_finished_at ?? 0,
            } as CompletedWorkout;
            workoutMap.set(row.workout_id, workout);
        }

        if (!row.exercise_id || !row.exercise_def_id) {
            continue;
        }

        let exercise = exerciseMap.get(row.exercise_id);
        if (!exercise) {
            exercise = {
                id: row.exercise_id,
                exerciseId: row.exercise_def_id,
                notes: parseNotesJson(row.exercise_notes_json ?? "[]"),
                sets: [],
            } as Exercise;
            exerciseMap.set(row.exercise_id, exercise);
            workout.exercises.push(exercise);
        }

        if (!row.set_id) {
            continue;
        }

        exercise.sets.push({
            id: row.set_id,
            weight: row.set_weight ?? "",
            reps: row.set_reps ?? "",
            type: row.set_type,
            finishTime: row.set_finished_at ?? undefined,
        } as Set);
    }

    const completed = Array.from(workoutMap.values());

    console.log(`Completed workouts fetched in ${Date.now() - startTime}ms`);
    return completed;
};

export const fetchExerciseSetsFromCompletedWorkouts = async (
    exerciseIds: string[],
    nWorkouts: number,
    beforeTimestamp?: number
): Promise<
    Record<string, { workoutId: string; finishedAt: number; sets: Set[] }[]>
> => {
    const startTime = Date.now();
    await ensureDatabase();

    if (exerciseIds.length === 0 || nWorkouts <= 0) {
        console.warn(`No exercise sets fetched in ${Date.now() - startTime}ms`);
        return {};
    }

    const db = await getDatabase();

    const exercisePlaceholders = exerciseIds.map(() => "?").join(", ");
    const hasBeforeTimestamp =
        beforeTimestamp != null && Number.isFinite(beforeTimestamp);

    // Filters out unfinished sets or where weight/reps are empty (gap not preserved)
    const rows = await db.getAllAsync<ExerciseSetsRow>(
        `SELECT exercises.id as exercise_id,
                exercises.exercise_def_id as exercise_def_id,
                workouts.id as workout_id,
                workouts.finished_at as workout_finished_at,
                sets.id as set_id,
                sets.position as position,
                sets.weight as weight,
                sets.reps as reps,
                sets.type as type,
                sets.finished_at as set_finished_at
         FROM exercises
         JOIN workouts ON workouts.id = exercises.workout_id
         LEFT JOIN sets ON sets.exercise_id = exercises.id
            AND (
                TRIM(COALESCE(sets.weight, '')) <> ''
                AND TRIM(COALESCE(sets.reps, '')) <> ''
                AND sets.finished_at IS NOT NULL
            )
         WHERE workouts.status = 'completed'
         AND exercises.exercise_def_id IN (${exercisePlaceholders})
         ${hasBeforeTimestamp ? "AND workouts.finished_at < ?" : ""}
         ORDER BY workouts.finished_at DESC, exercises.id, sets.position`,
        ...exerciseIds,
        ...(hasBeforeTimestamp ? [beforeTimestamp] : [])
    );

    if (rows.length === 0) {
        console.log(
            `Exercise sets fetched from ${nWorkouts} workouts in ${
                Date.now() - startTime
            }ms`
        );
        return {};
    }

    const setsByExercise = buildExerciseSetsFromRows(rows, nWorkouts);

    console.log(
        `Exercise sets fetched from ${nWorkouts} workouts in ${
            Date.now() - startTime
        }ms`
    );
    return setsByExercise;
};

type ExerciseSetsRow = {
    exercise_id: string;
    exercise_def_id: string;
    workout_id: string;
    workout_finished_at: number | null;
    set_id: string | null;
    position: number | null;
    weight: string | null;
    reps: string | null;
    type: SetType;
    set_finished_at: number | null;
};

const buildExerciseSetsFromRows = (
    rows: ExerciseSetsRow[],
    nWorkouts: number
) => {
    const result: Record<
        string,
        { workoutId: string; finishedAt: number; sets: Set[] }[]
    > = {};
    const entriesByExercise = new Map<
        string,
        { workoutId: string; finishedAt: number; sets: Set[] }
    >();

    for (const row of rows) {
        if (!row.set_id) {
            continue;
        }

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
                workoutId: row.workout_id,
                finishedAt: row.workout_finished_at ?? 0,
                sets: [],
            };
            result[exerciseDefId].push(entry);
            entriesByExercise.set(exerciseId, entry);
        }

        entry.sets.push({
            id: row.set_id,
            weight: row.weight ?? "",
            reps: row.reps ?? "",
            type: row.type,
            finishTime: row.set_finished_at ?? undefined,
        });
    }

    return result;
};

const parseNotesJson = (raw: string): Note[] => {
    try {
        const parsed = JSON.parse(raw);
        return parsed;
    } catch (error) {
        console.warn("Failed to parse notes JSON", error);
        return [];
    }
};

const parseMetadataJson = (raw: string): WorkoutMetadata => {
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed as WorkoutMetadata;
        }
        return {};
    } catch (error) {
        console.warn("Failed to parse metadata JSON", error);
        return {};
    }
};

const parseDefinitionJson = (raw: string): Exercise[] => {
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.map(normalizeExerciseFromDefinition);
    } catch (error) {
        console.warn("Failed to parse definition JSON", error);
        return [];
    }
};

const normalizeExerciseFromDefinition = (exercise: unknown): Exercise => {
    const parsed = (exercise ?? {}) as {
        id?: string;
        exerciseId?: string;
        notes?: Note[];
        sets?: unknown[];
    };
    return {
        id: parsed.id ?? generateGuid(),
        exerciseId: parsed.exerciseId ?? UNKNOWN_EXERCISE_DEF_ID,
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        sets: Array.isArray(parsed.sets)
            ? parsed.sets.map(normalizeSetFromDefinition)
            : [],
    };
};

const normalizeSetFromDefinition = (set: unknown): Set => {
    const parsed = (set ?? {}) as {
        id?: string;
        weight?: string;
        reps?: string;
        type?: SetType;
        setType?: SetType;
        finishTime?: number;
    };
    const parsedType = parsed.type ?? parsed.setType;
    return {
        id: parsed.id ?? generateGuid(),
        weight: parsed.weight ?? "",
        reps: parsed.reps ?? "",
        type:
            parsedType === "warmup" || parsedType === "default"
                ? parsedType
                : "default",
        finishTime: parsed.finishTime,
    };
};

const updateTemplateDefinitions = async (
    db: SQLite.SQLiteDatabase,
    mapExercise: (exercise: Exercise) => Exercise | null
) => {
    const templates = await db.getAllAsync<{
        id: string;
        definition_json: string;
    }>("SELECT id, definition_json FROM templates");

    for (const template of templates) {
        const parsed = parseDefinitionJson(template.definition_json);
        const mapped = parsed
            .map(mapExercise)
            .filter((exercise): exercise is Exercise => exercise !== null);
        const nextDefinitionJson = JSON.stringify(mapped);
        if (nextDefinitionJson === template.definition_json) {
            continue;
        }

        await db.runAsync(
            "UPDATE templates SET definition_json = ? WHERE id = ?",
            nextDefinitionJson,
            template.id
        );
    }
};
