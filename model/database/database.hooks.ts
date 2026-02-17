import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
    QueryKey,
    completeWorkout,
    createExerciseDef,
    updateExerciseDef,
    deleteExerciseDef,
    mergeExerciseDefs,
    createWorkoutTemplate,
    deleteWorkoutTemplate,
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
import { useActiveWorkoutMinimize } from "../ActiveWorkoutMinimizeContext";

export const useActiveWorkout = (): {
    activeWorkout: Workout | null;
    isLoading: boolean;
    isMinimized: boolean;
    minimize: () => void;
    restore: () => void;
} => {
    const { isLoading, error, data } = useSelect(
        QueryKey.ActiveWorkout,
        fetchActiveWorkout
    );
    const { isMinimized, minimize, restore } = useActiveWorkoutMinimize();

    if (error) {
        console.error(error);
    }

    return {
        activeWorkout: isLoading ? null : data ?? null,
        isLoading,
        isMinimized,
        minimize,
        restore,
    };
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
        onSuccess: (_, workout) => {
            queryClient.setQueryData([QueryKey.ActiveWorkout], workout);
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

    const updateExerciseDefMutation = useMutation({
        mutationFn: updateExerciseDef,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QueryKey.ExerciseDefs],
            });
        },
    });

    const deleteExerciseDefMutation = useMutation({
        mutationFn: deleteExerciseDef,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QueryKey.ExerciseDefs],
            });
        },
    });

    const mergeExerciseDefsMutation = useMutation({
        mutationFn: async (params: {
            targetExerciseDefId: string;
            sourceExerciseDefIds: string[];
        }) =>
            await mergeExerciseDefs(
                params.targetExerciseDefId,
                params.sourceExerciseDefIds
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QueryKey.ExerciseDefs],
                refetchType: "active",
            });
            queryClient.invalidateQueries({
                queryKey: [QueryKey.Workouts],
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

    const deleteWorkoutTemplateMutation = useMutation({
        mutationFn: deleteWorkoutTemplate,
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
        updateExerciseDef: async (id: string, def: ExerciseDef) =>
            await updateExerciseDefMutation.mutateAsync({ id, def }),
        deleteExerciseDef: async (exerciseDefId: string) =>
            await deleteExerciseDefMutation.mutateAsync(exerciseDefId),
        mergeExerciseDefs: async (
            targetExerciseDefId: string,
            sourceExerciseDefIds: string[]
        ) => {
            await mergeExerciseDefsMutation.mutateAsync({
                targetExerciseDefId,
                sourceExerciseDefIds,
            });
        },
        createWorkoutTemplate: async (template: WorkoutTemplate) =>
            await createWorkoutTemplateMutation.mutateAsync(template),
        deleteWorkoutTemplate: async (templateId: string) =>
            await deleteWorkoutTemplateMutation.mutateAsync(templateId),
        deleteCompletedWorkout: async (workoutId: string) =>
            await deleteCompletedWorkoutMutation.mutateAsync(workoutId),
    };
};
