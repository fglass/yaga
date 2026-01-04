import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
    QueryKey,
    completeWorkout,
    createExerciseDef,
    createWorkoutTemplate,
    deleteCompletedWorkout,
    fetchActiveWorkout,
    fetchCompletedWorkouts,
    fetchExerciseDefs,
    fetchWorkoutTemplates,
    saveActiveWorkout,
} from "./database";
import {
    Workout,
    CompletedWorkout,
    ExerciseDef,
    WorkoutTemplate,
} from "../types";

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

export const useWorkoutTemplates = (): {
    templates: WorkoutTemplate[];
    isLoading: boolean;
} => {
    const { isLoading, error, data } = useSelect(
        QueryKey.Workouts,
        fetchWorkoutTemplates
    );

    if (error) {
        console.error(error);
    }

    return {
        templates: isLoading ? [] : data ?? [],
        isLoading,
    };
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

const useSelect = <T>(
    key: QueryKey | (QueryKey | string[])[],
    queryFn: () => Promise<T>,
    enabled = true
) => {
    return useQuery({
        queryKey: Array.isArray(key) ? key : [key],
        queryFn,
        enabled,
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

    const deleteCompletedWorkoutMutation = useMutation({
        mutationFn: deleteCompletedWorkout,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QueryKey.CompletedWorkouts],
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
        createWorkoutTemplate: async (template: WorkoutTemplate) =>
            await createWorkoutTemplateMutation.mutateAsync(template),
        deleteCompletedWorkout: async (workoutId: string) =>
            await deleteCompletedWorkoutMutation.mutateAsync(workoutId),
    };
};
