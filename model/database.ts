import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { ExerciseDef, Workout } from "./types";
import { generateGuid, shareText, withWarning } from "../util";
import { EXERCISE_DEFS, WORKOUTS } from "./init";

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
        await insert(QueryKey.Workouts, WORKOUTS);
        await insert(QueryKey.CompletedWorkouts, []);
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

export const useCompletedWorkouts = (): Workout[] => {
    const { isLoading, error, data } = useSelect(QueryKey.CompletedWorkouts);

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
