import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { ExerciseDef, Workout } from "./types";
import { generateGuid, shareText, withWarning } from "../util";

export enum QueryKey {
    ExerciseDefs = "exerciseDefs",
    Version = "version",
    Workouts = "workouts",
    ActiveWorkout = "activeWorkout",
    CompletedWorkouts = "completedWorkouts",
}

export const initDatabase = async () => {
    const version = await select(QueryKey.Version);
    if (version == null) {
        await insert(QueryKey.Version, 1);
        await insert(QueryKey.Workouts, workouts);
        await insert(QueryKey.CompletedWorkouts, []);
        await insert(QueryKey.ExerciseDefs, exerciseDefs);
    }
};

export const exportDatabase = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);

    const payload = items.map(([key, value]) => {
        return { key, value };
    });
    const file = JSON.stringify(payload); // TODO: sanitise

    await shareText(file);
    console.log(file);
};

export const resetDatabase = () => {
    withWarning(async () => {
        await AsyncStorage.clear();
        console.warn("Database reset");
    });
};

/* Hooks */

export const useActiveWorkout = (): Workout | null => {
    const { isLoading, error, data } = useSelect(QueryKey.ActiveWorkout);

    if (error) {
        console.error(error);
    }

    return isLoading ? null : data;
};

export const useWorkouts = (): Workout[] => {
    const { isLoading, error, data } = useSelect(QueryKey.Workouts);

    if (error) {
        console.error(error);
    }

    return isLoading ? [] : data;
};

export const useExerciseDefs = (): Record<string, ExerciseDef> => {
    const { isLoading, error, data } = useSelect(QueryKey.ExerciseDefs);

    if (error) {
        console.error(error);
    }

    return isLoading ? {} : data;
};

const useSelect = (key: QueryKey) => {
    return useQuery(key, async () => await select(key));
};

export const useDatabaseWriter = () => {
    const queryClient = useQueryClient();

    const saveWorkoutMutation = useMutation({
        mutationFn: saveActiveWorkout,
        onSuccess: () => {
            queryClient.invalidateQueries(QueryKey.ActiveWorkout);
        },
    });

    const completeWorkoutMutation = useMutation({
        mutationFn: completeWorkout,
        onSuccess: () => {
            queryClient.invalidateQueries(QueryKey.CompletedWorkouts);
        },
    });

    const createDefMutation = useMutation({
        mutationFn: createExerciseDef,
        onSuccess: () => {
            queryClient.invalidateQueries(QueryKey.ExerciseDefs);
        },
    });

    return {
        saveActiveWorkout: async (workout: Workout | null) =>
            await saveWorkoutMutation.mutateAsync(workout),
        completeWorkout: async (workout: Workout) =>
            await completeWorkoutMutation.mutateAsync(workout),
        createExerciseDef: async (def: ExerciseDef) =>
            await createDefMutation.mutateAsync(def),
    };
};

/* Write functions */

export const saveActiveWorkout = async (workout: Workout | null) => {
    await insert(QueryKey.ActiveWorkout, workout);
};

const completeWorkout = async (workout: Workout) => {
    const completedWorkouts = await select(QueryKey.CompletedWorkouts);
    completedWorkouts.push(workout);
    await insert(QueryKey.CompletedWorkouts, completedWorkouts);
};

const createExerciseDef = async (def: ExerciseDef): Promise<string> => {
    const exerciseDefs = await select(QueryKey.ExerciseDefs);

    const exerciseId = generateGuid();
    exerciseDefs[exerciseId] = def;

    await insert(QueryKey.ExerciseDefs, exerciseDefs);
    return exerciseId;
};

/* Raw database operations */

const getPrefixedKey = (key: string) => `@yaga_${key}`;

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
                notes: [
                    {
                        id: "783973a1-e6b2-49ae-80c8-36387cbbc932",
                        value: "1 - 0 - 3",
                    },
                ],

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
                notes: [
                    {
                        id: "e86d9397-46bd-4b47-a774-816001a62060",
                        value: "5x5",
                    },
                ],
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
