import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "../database";
import {
    ensureHealthKit,
    fetchAppleHealthWorkouts,
    getHealthLoggingEnabled,
    syncAppleHealthRunsToDatabase,
} from "./health";
import { AppleHealthWorkout } from "../types";

export interface HealthWorkoutResult {
    workouts: AppleHealthWorkout[];
    isAvailable: boolean;
    isLoading: boolean;
}

export const useAppleHealthWorkouts = (): HealthWorkoutResult => {
    const queryClient = useQueryClient();

    const startOfPreviousYear = React.useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear() - 1, 0, 1);
    }, []);

    const { data, isLoading } = useQuery({
        queryKey: ["appleHealthWorkouts", startOfPreviousYear.getTime()],
        queryFn: async () => {
            const canUseHealthKit = await ensureHealthKit();
            if (!canUseHealthKit) {
                return {
                    workouts: [],
                    isAvailable: false,
                    insertedRunCount: 0,
                };
            }

            const workouts = await fetchAppleHealthWorkouts({
                since: startOfPreviousYear,
            });
            const insertedRunCount = getHealthLoggingEnabled()
                ? await syncAppleHealthRunsToDatabase(workouts)
                : 0;

            return { workouts, isAvailable: true, insertedRunCount };
        },
        staleTime: 5 * 60 * 1000,
    });

    React.useEffect(() => {
        if ((data?.insertedRunCount ?? 0) > 0) {
            queryClient.invalidateQueries({
                queryKey: [QueryKey.CompletedWorkouts],
            });
        }
    }, [data?.insertedRunCount, queryClient]);

    return {
        workouts: data?.workouts ?? [],
        isAvailable: data?.isAvailable ?? false,
        isLoading,
    };
};
