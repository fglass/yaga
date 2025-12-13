import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ensureHealthKit, fetchAppleHealthWorkouts } from "./health";
import { AppleHealthWorkout } from "../types";

export interface HealthWorkoutResult {
    workouts: AppleHealthWorkout[];
    isAvailable: boolean;
    isLoading: boolean;
}

export const useAppleHealthWorkouts = (): HealthWorkoutResult => {
    const startOfPreviousYear = React.useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear() - 1, 0, 1);
    }, []);

    const { data, isLoading } = useQuery({
        queryKey: ["appleHealthWorkouts", startOfPreviousYear.getTime()],
        queryFn: async () => {
            const canUseHealthKit = await ensureHealthKit();
            if (!canUseHealthKit) {
                return { workouts: [], isAvailable: false };
            }

            const workouts = await fetchAppleHealthWorkouts({
                since: startOfPreviousYear,
            });

            return { workouts, isAvailable: true };
        },
        staleTime: 5 * 60 * 1000,
    });

    return {
        workouts: data?.workouts ?? [],
        isAvailable: data?.isAvailable ?? false,
        isLoading,
    };
};
