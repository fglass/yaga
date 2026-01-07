import React from "react";
import { useCompletedWorkouts } from "../../model/database";
import { useAppleHealthWorkouts } from "../../model/health";
import { dedupeWorkoutsByStart, parseWorkoutTimestamp } from "../../utils/util";
import { computePeriodStats } from "./periodStats";

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
                distance: workout.distance,
            };
        });

        const localStrength = localWorkouts.filter(
            (workout) => workout.type === "strength"
        );
        const localRunning = localWorkouts.filter(
            (workout) => workout.type === "run"
        );

        const appleHealth = appleHealthWorkouts.map((workout) => ({
            startDate: workout.startDate,
            endDate: workout.endDate,
            type: workout.workoutType,
            distance: workout.distance,
        }));

        const appleHealthStrength = appleHealth.filter(
            (workout) => workout.type === "strength"
        );
        const appleHealthRunning = appleHealth.filter(
            (workout) => workout.type === "run"
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

    const stats = React.useMemo(
        () => computePeriodStats(strengthWorkouts, () => 1),
        [strengthWorkouts]
    );

    const runningDistanceStats = React.useMemo(
        () =>
            computePeriodStats(
                runningWorkouts,
                (workout) => workout.distance ?? 0
            ),
        [runningWorkouts]
    );

    return {
        workoutsThisWeek: stats.week.current,
        workoutsLastWeek: stats.week.previous,
        workoutsThisMonth: stats.month.current,
        workoutsLastMonth: stats.month.previous,
        workoutsThisYear: stats.year.current,
        workoutsLastYear: stats.year.previous,
        runDistanceThisWeek: formatDistance(runningDistanceStats.week.current),
        runDistanceLastWeek: formatDistance(runningDistanceStats.week.previous),
        runDistanceThisMonth: formatDistance(
            runningDistanceStats.month.current
        ),
        runDistanceLastMonth: formatDistance(
            runningDistanceStats.month.previous
        ),
        runDistanceThisYear: formatDistance(runningDistanceStats.year.current),
        runDistanceLastYear: formatDistance(runningDistanceStats.year.previous),
        isLoading: isAppleHealthLoading,
    };
};

const formatDistance = (distance: number) => {
    if (!Number.isFinite(distance)) {
        return 0;
    }

    return Math.floor(distance);
};
