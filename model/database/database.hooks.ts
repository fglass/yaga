import { useQuery, useQueryClient, useMutation } from "react-query";
import {
    QueryKey,
    completeWorkout,
    createExerciseDef,
    saveActiveWorkout,
    select,
} from "./database";
import { Workout, CompletedWorkout, ExerciseDef } from "../types";

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

export const useCompletedWorkouts = (): CompletedWorkout[] => {
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

    const saveActiveWorkoutMutation = useMutation({
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

    const createExerciseDefMutation = useMutation({
        mutationFn: createExerciseDef,
        onSuccess: () => {
            queryClient.invalidateQueries(QueryKey.ExerciseDefs);
        },
    });

    return {
        saveActiveWorkout: async (workout: Workout | null) =>
            await saveActiveWorkoutMutation.mutateAsync(workout),
        completeWorkout: async (workout: CompletedWorkout) =>
            await completeWorkoutMutation.mutateAsync(workout),
        createExerciseDef: async (def: ExerciseDef) =>
            await createExerciseDefMutation.mutateAsync(def),
    };
};
