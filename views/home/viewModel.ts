import React from "react";
import { WorkoutActivityType } from "@kingstinct/react-native-healthkit";
import { useCompletedWorkouts } from "../../model/database";
import { useAppleHealthWorkouts } from "../../model/health";
import {
    dedupeWorkoutsByStart,
    parseWorkoutTimestamp,
} from "../../utils/util";

export const useHomeViewModel = () => {
    const completedWorkouts = useCompletedWorkouts();
    const { workouts: appleHealthWorkouts, isLoading: isAppleHealthLoading } =
        useAppleHealthWorkouts();

    const { strengthWorkouts, runningWorkouts } = React.useMemo(() => {
        const localWorkouts = completedWorkouts.map((workout) => {
            const startDate = parseWorkoutTimestamp(workout.startTimestamp);
            const endDate = parseWorkoutTimestamp(workout.endTimestamp);
            return {
                startDate,
                endDate,
                type: workout.type,
            };
        });

        const localStrength = localWorkouts.filter(
            (workout) => workout.type === "strength"
        );
        const localRunning = localWorkouts.filter(
            (workout) => workout.type === "run"
        );

        const appleHealth = appleHealthWorkouts.map((workout) => ({
            startDate: new Date(workout.startDate),
            endDate: new Date(workout.endDate),
            activityType: workout.activityType,
        }));

        const appleHealthStrength = appleHealth.filter(
            (workout) =>
                workout.activityType ===
                WorkoutActivityType.traditionalStrengthTraining
        );
        const appleHealthRunning = appleHealth.filter(
            (workout) => workout.activityType === WorkoutActivityType.running
        );

        return {
            strengthWorkouts: dedupeWorkoutsByStart([
                ...localStrength,
                ...appleHealthStrength,
            ]),
            runningWorkouts: dedupeWorkoutsByStart([
                ...localRunning,
                ...appleHealthRunning,
            ]),
        };
    }, [completedWorkouts, appleHealthWorkouts]);

    const computeStats = React.useCallback(
        (
            workouts: {
                startDate: Date | null;
                endDate: Date | null;
            }[]
        ) => {
            const now = new Date();
            const startOfWeek = getStartOfWeek(now);
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const previousWeekStart = addDays(startOfWeek, -7);
            const previousMonthStart = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1
            );
            const previousYearStart = new Date(now.getFullYear() - 1, 0, 1);

            return workouts.reduce(
                (acc, workout) => {
                    const completedDate = workout.endDate ?? workout.startDate;

                    if (!completedDate) {
                        return acc;
                    }

                    if (completedDate >= startOfWeek) {
                        acc.week.current += 1;
                    } else if (
                        completedDate >= previousWeekStart &&
                        completedDate < startOfWeek
                    ) {
                        acc.week.previous += 1;
                    }

                    if (completedDate >= startOfMonth) {
                        acc.month.current += 1;
                    } else if (
                        completedDate >= previousMonthStart &&
                        completedDate < startOfMonth
                    ) {
                        acc.month.previous += 1;
                    }

                    if (completedDate >= startOfYear) {
                        acc.year.current += 1;
                    } else if (
                        completedDate >= previousYearStart &&
                        completedDate < startOfYear
                    ) {
                        acc.year.previous += 1;
                    }

                    return acc;
                },
                {
                    week: { current: 0, previous: 0 },
                    month: { current: 0, previous: 0 },
                    year: { current: 0, previous: 0 },
                }
            );
        },
        []
    );

    const stats = React.useMemo(
        () => computeStats(strengthWorkouts),
        [strengthWorkouts, computeStats]
    );

    const runningStats = React.useMemo(
        () => computeStats(runningWorkouts),
        [runningWorkouts, computeStats]
    );

    return {
        workoutsThisWeek: stats.week.current,
        workoutsLastWeek: stats.week.previous,
        workoutsThisMonth: stats.month.current,
        workoutsLastMonth: stats.month.previous,
        workoutsThisYear: stats.year.current,
        workoutsLastYear: stats.year.previous,
        runsThisWeek: runningStats.week.current,
        runsLastWeek: runningStats.week.previous,
        runsThisMonth: runningStats.month.current,
        runsLastMonth: runningStats.month.previous,
        runsThisYear: runningStats.year.current,
        runsLastYear: runningStats.year.previous,
        isLoading: isAppleHealthLoading,
    };
};

const getStartOfWeek = (reference: Date) => {
    const start = new Date(reference);
    start.setHours(0, 0, 0, 0);
    const distanceToMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - distanceToMonday);
    return start;
};

const addDays = (reference: Date, days: number) => {
    const date = new Date(reference);
    date.setDate(date.getDate() + days);
    return date;
};
