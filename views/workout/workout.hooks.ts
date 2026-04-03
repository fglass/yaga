import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { fetchExerciseSetsFromCompletedWorkouts } from "../../model/database";
import type { Set, Workout } from "../../model/types";
import { createLatestTaskQueue } from "./workout.saveQueue";

interface WorkoutDurationParams {
    initialStartTimeMs?: number;
    isEnabled?: boolean;
}

export const useWorkoutDuration = ({
    initialStartTimeMs,
    isEnabled = true,
}: WorkoutDurationParams) => {
    const workoutStartTimeRef = useRef(initialStartTimeMs ?? Date.now());
    const [workoutDurationS, setWorkoutDurationS] = useState(0);

    useEffect(() => {
        if (!isEnabled) {
            return;
        }

        const intervalId = setInterval(() => {
            setWorkoutDurationS(
                Math.round((Date.now() - workoutStartTimeRef.current) / 1000)
            );
        }, 250); // Run every 250ms to help with UI syncing

        return () => clearInterval(intervalId);
    }, [isEnabled]);

    return {
        workoutStartTime: workoutStartTimeRef.current,
        workoutDurationS,
    };
};

export type ExerciseSetsEntry = {
    workoutId: string;
    finishedAt: number;
    note: string | null;
    sets: Set[];
};

type ExerciseSetsFromCompletedWorkoutsParams = {
    exerciseIds: string[];
    nWorkouts: number;
    isEnabled?: boolean;
    beforeTimestamp?: number;
};

// Shared by:
//  - workout.viewModel for last-session set comparison
//  - exerciseHistory.viewModel for paged history rows
export const useExerciseSetsFromCompletedWorkouts = ({
    exerciseIds,
    nWorkouts,
    isEnabled = true,
    beforeTimestamp,
}: ExerciseSetsFromCompletedWorkoutsParams) => {
    const [isLoading, setIsLoading] = useState(false);
    const [historySets, setHistorySets] = useState<
        Record<string, ExerciseSetsEntry[]>
    >({});

    const exerciseIdsKey = useMemo(() => {
        const uniqueIds = Array.from(new Set(exerciseIds)).filter(Boolean);
        uniqueIds.sort();
        return uniqueIds.join("|");
    }, [exerciseIds]);

    useEffect(() => {
        let isActive = true;

        if (!isEnabled || exerciseIdsKey.length === 0 || nWorkouts <= 0) {
            setIsLoading(false);
            return () => {
                isActive = false;
            };
        }

        setIsLoading(true);
        const ids = exerciseIdsKey.split("|");

        fetchExerciseSetsFromCompletedWorkouts(ids, nWorkouts, beforeTimestamp)
            .then((history) => {
                if (!isActive) {
                    return;
                }
                setHistorySets(history);
            })
            .catch(() => {
                if (!isActive) {
                    return;
                }
                setHistorySets({});
            })
            .finally(() => {
                if (!isActive) {
                    return;
                }
                setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [beforeTimestamp, exerciseIdsKey, isEnabled, nWorkouts]);

    return { isLoading, historySets };
};

interface ActiveWorkoutAutosaveParams {
    workout: Workout;
    saveActiveWorkout: (workout: Workout) => Promise<void>;
    getLatestWorkout: () => Workout;
    isEnabled: boolean;
}

export const useActiveWorkoutAutosave = ({
    workout,
    saveActiveWorkout,
    getLatestWorkout,
    isEnabled,
}: ActiveWorkoutAutosaveParams) => {
    const saveActiveWorkoutRef = useRef(saveActiveWorkout);
    saveActiveWorkoutRef.current = saveActiveWorkout;

    const activeWorkoutSaveQueue = useMemo(
        () =>
            createLatestTaskQueue<Workout>(async (nextWorkout) => {
                await saveActiveWorkoutRef.current(nextWorkout);
            }),
        []
    );

    useEffect(() => {
        if (!isEnabled) {
            return;
        }
        void activeWorkoutSaveQueue.enqueue(workout);
    }, [activeWorkoutSaveQueue, isEnabled, workout]);

    const persistActiveWorkout = useCallback(async () => {
        if (!isEnabled) {
            return;
        }
        await activeWorkoutSaveQueue.enqueue(getLatestWorkout());
        await activeWorkoutSaveQueue.flush();
    }, [activeWorkoutSaveQueue, getLatestWorkout, isEnabled]);

    const flushActiveWorkoutSaves = useCallback(async () => {
        await activeWorkoutSaveQueue.flush();
    }, [activeWorkoutSaveQueue]);

    return {
        persistActiveWorkout,
        flushActiveWorkoutSaves,
    };
};
