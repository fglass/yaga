import { EXERCISE_DEFS, WORKOUT_TEMPLATES } from "./database.data";
import { CompletedWorkout, ExerciseDef, Workout } from "../types";
import { generateGuid, shareText, withWarning } from "../../util";
import {
    clearAllEntries,
    ensureDatabase,
    getAllEntries,
    getValue as getSqlValue,
    setValue as setSqlValue,
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
    console.log("Initialising database...");
    await ensureDatabase();

    const version = await select(QueryKey.Version);
    console.log(`Database version: ${version}`);

    if (version == null) {
        // TODO: fix init
        console.log("Inserting initial data...");
        await insert(QueryKey.Version, 1);
        await insert(QueryKey.Workouts, WORKOUT_TEMPLATES);
        await insert(QueryKey.CompletedWorkouts, []);
        await insert(QueryKey.ActiveWorkout, null);
        await insert(QueryKey.ExerciseDefs, EXERCISE_DEFS);
        return;
    }

    const existingWorkouts = (await select(QueryKey.Workouts)) ?? [];
    const existingExerciseDefs = (await select(QueryKey.ExerciseDefs)) ?? {};
    const workouts = mergeWorkouts(existingWorkouts, WORKOUT_TEMPLATES);
    const exerciseDefs = mergeExerciseDefs(existingExerciseDefs, EXERCISE_DEFS);

    await insert(QueryKey.Workouts, workouts);
    await insert(QueryKey.ExerciseDefs, exerciseDefs);
};

export const exportDatabase = async () => {
    const items = await getAllEntries();

    const payload: Record<string, unknown> = {};
    items.forEach(({ key, value }) => {
        payload[key] = value != null ? JSON.parse(value) : "";
    });

    const file = JSON.stringify(payload);
    await shareText(file);
};

export const resetDatabase = () => {
    withWarning(async () => {
        await clearAllEntries();
        console.warn("Database reset");
    });
};

/* Write functions */

export const createWorkoutTemplate = async (workout: Workout) => {
    const workouts = (await select(QueryKey.Workouts)) ?? [];
    workouts.push(workout);
    await insert(QueryKey.Workouts, workouts);
};

export const saveActiveWorkout = async (workout: Workout | null) => {
    await insert(QueryKey.ActiveWorkout, workout);
};

export const completeWorkout = async (workout: CompletedWorkout) => {
    const completedWorkouts = await select(QueryKey.CompletedWorkouts);
    completedWorkouts.push(workout);
    await insert(QueryKey.CompletedWorkouts, completedWorkouts);
};

export const createExerciseDef = async (def: ExerciseDef): Promise<string> => {
    const exerciseDefs = await select(QueryKey.ExerciseDefs);

    const exerciseId = generateGuid();
    exerciseDefs[exerciseId] = def;

    await insert(QueryKey.ExerciseDefs, exerciseDefs);
    return exerciseId;
};

/* Raw operations */

export const select = async (key: QueryKey) => {
    try {
        await ensureDatabase();
        const jsonValue = await getSqlValue(key);
        return jsonValue != null ? JSON.parse(jsonValue) : undefined;
    } catch (e) {
        console.error(e);
    }
};

export const insert = async (key: QueryKey, value: unknown) => {
    try {
        await ensureDatabase();
        const jsonValue = JSON.stringify(value);
        await setSqlValue(key, jsonValue);
    } catch (e) {
        console.error(e);
    }
};

/* Helpers */

const mergeWorkouts = (existing: Workout[], templates: Workout[]) => {
    const templateNames = new Set(
        templates.map((workout) => workout.name.toLowerCase())
    );
    const existingWithoutCollisions = existing.filter(
        (workout) => !templateNames.has(workout.name.toLowerCase())
    );
    return [...templates, ...existingWithoutCollisions];
};

const mergeExerciseDefs = (
    existing: Record<string, ExerciseDef>,
    templates: Record<string, ExerciseDef>
) => ({
    ...templates,
    ...existing,
});
