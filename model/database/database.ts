import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXERCISE_DEFS, WORKOUT_TEMPLATES } from "./database.data";
import { CompletedWorkout, ExerciseDef, Workout } from "../types";
import { generateGuid, shareText, withWarning } from "../../util";

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

    const version = await select(QueryKey.Version);
    console.log(`Database version: ${version}`);

    if (version == null) {
        console.log("Inserting initial data...");
        await insert(QueryKey.Version, 1);
        await insert(QueryKey.Workouts, WORKOUT_TEMPLATES);
        await insert(QueryKey.CompletedWorkouts, []);
        await insert(QueryKey.ActiveWorkout, null);
        await insert(QueryKey.ExerciseDefs, EXERCISE_DEFS);
    }
};

export const exportDatabase = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);

    const payload: Record<string, object> = {};
    items.forEach(([key, value]) => {
        payload[key] = value != null ? JSON.parse(value) : "";
    });

    const file = JSON.stringify(payload);
    await shareText(file);
};

export const resetDatabase = () => {
    withWarning(async () => {
        await AsyncStorage.clear();
        console.warn("Database reset");
    });
};

/* Write functions */

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

export const select = async (key: string) => {
    try {
        const jsonValue = await AsyncStorage.getItem(getPrefixedKey(key));
        return jsonValue != null ? JSON.parse(jsonValue) : undefined;
    } catch (e) {
        console.error(e);
    }
};

export const insert = async (key: string, value: unknown) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(getPrefixedKey(key), jsonValue);
    } catch (e) {
        console.error(e);
    }
};

const getPrefixedKey = (key: string) => `@yaga_${key}`;
