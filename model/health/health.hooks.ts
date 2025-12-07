import React from "react";
import { ensureHealthKit, fetchAppleHealthWorkouts } from "./health";
import { AppleHealthWorkout } from "../types";

export interface HealthWorkoutResult {
    workouts: AppleHealthWorkout[];
    isAvailable: boolean;
    isLoading: boolean;
}

export const useAppleHealthWorkouts = (): HealthWorkoutResult => {
    const [workouts, setWorkouts] = React.useState<AppleHealthWorkout[]>([]);
    const [isAvailable, setIsAvailable] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        let didCancel = false;

        const load = async () => {
            setIsLoading(true);
            const canUseHealthKit = await ensureHealthKit();
            if (!canUseHealthKit) {
                if (!didCancel) {
                    setIsAvailable(false);
                    setIsLoading(false);
                }
                return;
            }

            // TODO: add caching
            const workouts = await fetchAppleHealthWorkouts();

            if (didCancel) {
                return;
            }

            setIsAvailable(true);
            setWorkouts(workouts);
            setIsLoading(false);
        };

        load();

        return () => {
            didCancel = true;
        };
    }, []);

    return { workouts, isAvailable, isLoading };
};