import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "react-query";
import { ExerciseDef, Workout } from "./types";
import { generateGuid } from "../util";

enum Key {
    ExerciseDefs = "exerciseDefs",
    Version = "version",
    Workouts = "workouts",
}

export const initDatabase = async () => {
    // AsyncStorage.clear();
    const version = await select(Key.Version);
    if (version == null) {
        await insert(Key.Version, 1);
        await insert(Key.Workouts, workouts);
        await insert(Key.ExerciseDefs, exerciseDefs);
    }
};

/* Hooks */

export const useWorkouts = (): Workout[] => {
    const { isLoading, error, data } = useSelect(Key.Workouts);

    if (error) {
        console.error(error);
    }

    return isLoading ? [] : data;
};

export const useExerciseDefs = (): Record<string, ExerciseDef> => {
    const { isLoading, error, data } = useSelect(Key.ExerciseDefs);

    if (error) {
        console.error(error);
    }

    return isLoading ? {} : data;
};

// TODO: refactor, RQ mutation?
export const createExerciseDef = async (
    name: string,
    category: string
): Promise<string> => {
    const exerciseDefs = await select(Key.ExerciseDefs);

    const exerciseId = generateGuid();
    exerciseDefs[exerciseId] = { name, category };

    await insert(Key.ExerciseDefs, exerciseDefs);
    return exerciseId;
};

const useSelect = (key: string) => {
    return useQuery(key, async () => await select(key));
};

/* Database operations */
// TODO: https://docs.expo.dev/versions/latest/sdk/sqlite/

const getPrefixedKey = (key: string) => `$@yaga_${key}`;

const select = async (key: string) => {
    try {
        const jsonValue = await AsyncStorage.getItem(getPrefixedKey(key));
        return jsonValue != null ? JSON.parse(jsonValue) : undefined;
    } catch (e) {
        console.error(e);
    }
};

const insert = async (key: string, value: unknown) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(getPrefixedKey(key), jsonValue);
    } catch (e) {
        console.error(e);
    }
};

/* Initial records */

const exerciseDefs: Record<string, ExerciseDef> = {
    "6a001abb-1a20-4ccc-bf81-d5825923f8c8": {
        name: "Squat",
        category: "Legs",
    },
    "34da1abc-cfbc-4dda-b2b5-58c16de24d3a": {
        name: "Lying Leg Curl",
        category: "Legs",
    },
    "fb87dc04-da1c-4481-a3df-1776662c4a01": {
        name: "Seated Calf Raise",
        category: "Legs",
    },
};

const workouts: Workout[] = [
    {
        id: "aaef536e-26e6-4f63-ad67-a72f348a46ca",
        name: "Legs #1",
        exercises: [
            {
                id: "6bb456eb-e10a-4328-8d89-eabc78eacba1",
                exerciseId: "6a001abb-1a20-4ccc-bf81-d5825923f8c8",
                notes: ["1 - 0 - 3"],
                sets: [
                    { id: "0", weight: "", reps: "", finished: false },
                    { id: "1", weight: "", reps: "", finished: false },
                    { id: "2", weight: "", reps: "", finished: false },
                ],
            },
            {
                id: "2f40e9c3-c7a3-49b7-a053-d41489c487fc",
                exerciseId: "34da1abc-cfbc-4dda-b2b5-58c16de24d3a",
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finished: false },
                    { id: "1", weight: "", reps: "", finished: false },
                    { id: "2", weight: "", reps: "", finished: false },
                ],
            },
            {
                id: "ba3aed70-494b-4a47-91c6-d96438711784",
                exerciseId: "fb87dc04-da1c-4481-a3df-1776662c4a01",
                notes: ["5x5"],
                sets: [
                    { id: "0", weight: "", reps: "", finished: false },
                    { id: "1", weight: "", reps: "", finished: false },
                    { id: "2", weight: "", reps: "", finished: false },
                ],
            },
        ],
        notes: "",
    },
    {
        id: "8727d104-b53f-463d-8b84-3ce66ba3d9a4",
        name: "Legs #2",
        exercises: [],
        notes: "",
    },
];
