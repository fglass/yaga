import { Platform } from "react-native";
import {
    isHealthDataAvailableAsync,
    queryWorkoutSamples,
    requestAuthorization,
    saveWorkoutSample,
    WorkoutActivityType,
    WorkoutTypeIdentifier,
    WorkoutSample,
} from "@kingstinct/react-native-healthkit";
import type {
    QuantityTypeIdentifier,
    QueryStatisticsResponse,
} from "@kingstinct/react-native-healthkit";
import { AppleHealthWorkout, WorkoutType } from "../types";

export interface HealthWorkoutPayload {
    startDate: Date;
    endDate: Date;
    calories: number;
    workoutType: WorkoutType;
}

export interface FetchAppleHealthWorkoutsOptions {
    since?: Date;
    limit?: number;
}

let initPromise: Promise<boolean> | null = null;
let isHealthLoggingEnabled = true;
type WorkoutProxyItem = Awaited<ReturnType<typeof queryWorkoutSamples>>[number];

export const ensureHealthKit = async (): Promise<boolean> => {
    if (Platform.OS !== "ios") {
        return false;
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            const available = await isHealthDataAvailableAsync();
            if (!available) {
                console.warn("Apple Health not available on this device");
                return false;
            }

            await requestAuthorization({
                toShare: [WorkoutTypeIdentifier],
                toRead: [
                    WorkoutTypeIdentifier,
                    "HKQuantityTypeIdentifierDistanceWalkingRunning",
                ],
            });
            return true;
        } catch (error) {
            console.warn("HealthKit authorization failed", error);
            return false;
        }
    })();

    return initPromise;
};

export const logAppleHealthWorkout = async (
    payload: HealthWorkoutPayload
): Promise<boolean> => {
    if (!isHealthLoggingEnabled) {
        console.log("Apple Health logging is disabled");
        return false;
    }

    const canUseHealthKit = await ensureHealthKit();
    if (!canUseHealthKit) {
        return false;
    }

    try {
        console.log("Saving workout to Apple Health...");
        const activityType =
            payload.workoutType === "strength"
                ? WorkoutActivityType.traditionalStrengthTraining
                : WorkoutActivityType.running;
        const workoutTotals = { energyBurned: payload.calories };
        await saveWorkoutSample(
            activityType,
            [], // Quantities omitted for now
            payload.startDate,
            payload.endDate,
            workoutTotals
        );
        return true;
    } catch (error) {
        console.warn("Failed to save workout to Apple Health", error);
        return false;
    }
};

export const getHealthLoggingEnabled = () => isHealthLoggingEnabled;

export const setHealthLoggingEnabled = (enabled: boolean) => {
    isHealthLoggingEnabled = enabled;
};

export const fetchAppleHealthWorkouts = async (
    options?: FetchAppleHealthWorkoutsOptions
): Promise<AppleHealthWorkout[]> => {
    const startTime = Date.now();
    try {
        const workoutQueryOptions = {
            ascending: false,
            limit: options?.limit ?? 10_000,
            filter: options?.since ? { startDate: options.since } : undefined,
        };
        const workoutProxies = await queryWorkoutSamples({
            ...workoutQueryOptions,
        });

        const workouts: AppleHealthWorkout[] = [];
        for (const proxy of workoutProxies) {
            const sample = proxy.toJSON();
            const distance = await getRunDistance(
                proxy,
                sample.workoutActivityType
            );
            const workout = asHealthWorkout(sample, distance);
            if (workout != null) {
                workouts.push(workout);
            }
        }

        const result = workouts.filter(dedupe());
        console.log(
            `Apple Health workouts fetched in ${Date.now() - startTime}ms`
        );
        return result;
    } catch (error) {
        console.warn("Failed to query Apple Health workouts", error);
        return [];
    }
};

const getRunDistance = async (
    proxy: WorkoutProxyItem,
    activityType: WorkoutActivityType
): Promise<number | undefined> => {
    if (activityType !== WorkoutActivityType.running) {
        return undefined;
    }

    try {
        const distanceIdentifier: QuantityTypeIdentifier =
            "HKQuantityTypeIdentifierDistanceWalkingRunning";
        const stats: QueryStatisticsResponse | undefined =
            await proxy.getStatistic(distanceIdentifier, "km");
        const distance = stats?.sumQuantity?.quantity;
        return typeof distance === "number" ? distance : undefined;
    } catch (error) {
        console.warn("Failed to read Apple Health run distance", error);
        return undefined;
    }
};

const asHealthWorkout = (
    sample: WorkoutSample,
    distance?: number
): AppleHealthWorkout | null => {
    if (!sample.startDate || !sample.endDate) {
        return null;
    }

    const startDate = new Date(sample.startDate);
    const endDate = new Date(sample.endDate);
    const durationSeconds =
        typeof sample.duration?.quantity === "number"
            ? Math.round(sample.duration.quantity)
            : Math.max(
                  0,
                  Math.round((endDate.getTime() - startDate.getTime()) / 1000)
              );

    const workoutType = mapWorkoutType(sample.workoutActivityType);
    if (workoutType == null) {
        return null;
    }

    return {
        id: sample.uuid,
        name: formatActivityName(sample.workoutActivityType),
        startDate,
        endDate,
        durationSeconds,
        activityType: sample.workoutActivityType,
        workoutType,
        distance,
    };
};

const dedupe = () => {
    const seen = new Set<string>();
    return (workout: AppleHealthWorkout): boolean => {
        const key = `${workout.startDate.toISOString()}|${
            workout.durationSeconds
        }`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    };
};

const formatActivityName = (activityType: WorkoutActivityType): string => {
    const activityLabel = WorkoutActivityType[activityType];
    const formatted =
        activityLabel != null
            ? activityLabel
                  .replace(/([a-z])([A-Z])/g, "$1 $2")
                  .replace(/_/g, " ")
                  .split(" ")
                  .filter((word) => word.length > 0)
                  .map(
                      (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase()
                  )
                  .join(" ")
            : "Workout";

    const remapped = {
        Running: "Run",
        "Traditional Strength Training": "Strength",
    };

    return remapped[formatted as keyof typeof remapped] ?? formatted;
};

const mapWorkoutType = (
    activityType: WorkoutActivityType
): WorkoutType | null => {
    if (activityType === WorkoutActivityType.running) {
        return "run";
    }

    if (activityType === WorkoutActivityType.traditionalStrengthTraining) {
        return "strength";
    }

    return null;
};
