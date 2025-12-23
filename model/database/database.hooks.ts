import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
    QueryKey,
    completeWorkout,
    createExerciseDef,
    createWorkoutTemplate,
    fetchActiveWorkout,
    fetchCompletedWorkouts,
    fetchExerciseDefs,
    fetchWorkoutTemplates,
    saveActiveWorkout,
} from "./database";
import { Workout, CompletedWorkout, ExerciseDef } from "../types";

export const useActiveWorkout = (): Workout | null => {
    const { isLoading, error, data } = useSelect(
        QueryKey.ActiveWorkout,
        fetchActiveWorkout
    );

    if (error) {
        console.error(error);
    }

    return isLoading ? null : data ?? null;
};

export const useWorkoutTemplates = (): Workout[] => {
    const { isLoading, error, data } = useSelect(
        QueryKey.Workouts,
        fetchWorkoutTemplates
    );

    if (error) {
        console.error(error);
    }

    return isLoading ? [] : data ?? [];
};

export const useCompletedWorkouts = (): CompletedWorkout[] => {
    const { isLoading, error, data } = useSelect(
        QueryKey.CompletedWorkouts,
        fetchCompletedWorkouts
    );

    if (error) {
        console.error(error);
    }

    return isLoading ? [] : data ?? [];
};

export const useExerciseDefs = (): Record<string, ExerciseDef> => {
    const { isLoading, error, data } = useSelect(
        QueryKey.ExerciseDefs,
        fetchExerciseDefs
    );

    if (error) {
        console.error(error);
    }

    return isLoading ? {} : data ?? {};
};

const useSelect = <T>(key: QueryKey, queryFn: () => Promise<T>) => {
    return useQuery({
        queryKey: [key],
        queryFn,
    });
};

export const useDatabaseWriter = () => {
    const queryClient = useQueryClient();

    const saveActiveWorkoutMutation = useMutation({
        mutationFn: saveActiveWorkout,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QueryKey.ActiveWorkout],
            });
        },
    });

    const completeWorkoutMutation = useMutation({
        mutationFn: completeWorkout,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QueryKey.CompletedWorkouts],
            });
        },
    });

    const createExerciseDefMutation = useMutation({
        mutationFn: createExerciseDef,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QueryKey.ExerciseDefs],
            });
        },
    });

    const createWorkoutTemplateMutation = useMutation({
        mutationFn: createWorkoutTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QueryKey.Workouts],
            });
        },
    });

    return {
        saveActiveWorkout: async (workout: Workout | null) =>
            await saveActiveWorkoutMutation.mutateAsync(workout),
        completeWorkout: async (workout: CompletedWorkout) =>
            await completeWorkoutMutation.mutateAsync(workout),
        createExerciseDef: async (def: ExerciseDef) =>
            await createExerciseDefMutation.mutateAsync(def),
        createWorkoutTemplate: async (workout: Workout) =>
            await createWorkoutTemplateMutation.mutateAsync(workout),
    };
};
