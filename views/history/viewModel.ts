import React from "react";
import { useCompletedWorkouts, useDatabaseWriter } from "../../model/database";
import { useAppleHealthWorkouts } from "../../model/health";
import { AppleHealthWorkout, CompletedWorkout } from "../../model/types";
import {
    dedupeWorkoutsByStart,
    parseWorkoutStart,
    withWarning,
} from "../../utils/util";

export type HistoryItem =
    | { type: "local"; workout: CompletedWorkout; startDate: Date }
    | { type: "health"; workout: AppleHealthWorkout; startDate: Date };

interface ViewModel {
    combinedHistory: HistoryItem[];
    isAppleHealthLoading: boolean;
    onDeleteLocalWorkout: (workout: CompletedWorkout) => void;
    formatWorkoutDate: (date: Date | null | undefined) => string;
}

export const useHistoryViewModel = (): ViewModel => {
    const completedWorkouts = useCompletedWorkouts();
    const { workouts: appleHealthWorkouts, isLoading: isAppleHealthLoading } =
        useAppleHealthWorkouts();
    const { deleteCompletedWorkout } = useDatabaseWriter();

    const combinedHistory = React.useMemo<HistoryItem[]>(() => {
        const items = [
            ...completedWorkouts.map<HistoryItem>((workout) => ({
                type: "local",
                startDate: parseWorkoutStart(
                    workout.startTimestamp,
                    workout.endTimestamp
                ),
                workout,
            })),
            ...appleHealthWorkouts.map<HistoryItem>((workout) => ({
                type: "health",
                startDate: workout.startDate,
                workout,
            })),
        ];

        const dedupedItems = dedupeWorkoutsByStart(items);

        const sortByDate = (item: HistoryItem): number => {
            if (item.type === "local") {
                return (
                    parseWorkoutStart(
                        item.workout.startTimestamp,
                        item.workout.endTimestamp
                    )?.getTime() ?? Number.NEGATIVE_INFINITY
                );
            }
            return item.workout.startDate.getTime();
        };

        return dedupedItems.sort((a, b) => sortByDate(b) - sortByDate(a));
    }, [completedWorkouts, appleHealthWorkouts]);

    const onDeleteLocalWorkout = React.useCallback(
        (workout: CompletedWorkout) => {
            withWarning(
                () => {
                    void deleteCompletedWorkout(workout.id);
                },
                "Delete Workout",
                "Are you sure?"
            );
        },
        [deleteCompletedWorkout]
    );

    const formatWorkoutDate = React.useCallback(
        (date: Date | null | undefined): string => {
            if (!date || Number.isNaN(date.getTime())) {
                return "Unknown date";
            }

            const datePart = date.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
            const timePart = date.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
            });

            return `${datePart}, ${timePart}`;
        },
        []
    );

    return {
        combinedHistory,
        isAppleHealthLoading,
        onDeleteLocalWorkout,
        formatWorkoutDate,
    };
};
