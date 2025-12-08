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
import { AppleHealthWorkout } from "../types";

export interface HealthWorkoutPayload {
    startDate: Date;
    endDate: Date;
    calories?: number;
}

const APP_BUNDLE_IDENTIFIER = "com.expench.yaga";
let initPromise: Promise<boolean> | null = null;
let isHealthLoggingEnabled = true;

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
                toRead: [WorkoutTypeIdentifier],
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
        console.log("Saving workout to Apple Health");
        await saveWorkoutSample(
            WorkoutActivityType.traditionalStrengthTraining,
            [], // Quantities omitted for now
            payload.startDate,
            payload.endDate
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

export const fetchAppleHealthWorkouts = async (): Promise<
    AppleHealthWorkout[]
> => {
    try {
        const workoutProxies = await queryWorkoutSamples({
            ascending: false,
            limit: 20,
        });

        return workoutProxies
            .map((proxy) => proxy.toJSON())
            .map(asHealthWorkout)
            .filter(
                (workout): workout is AppleHealthWorkout => workout != null
            );
    } catch (error) {
        console.warn("Failed to query Apple Health workouts", error);
        return [];
    }
};

const asHealthWorkout = (sample: WorkoutSample): AppleHealthWorkout | null => {
    if (isWorkoutLoggedByApp(sample)) {
        return null;
    }

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

    return {
        id: sample.uuid,
        name: formatActivityName(sample.workoutActivityType),
        startDate,
        endDate,
        durationSeconds,
    };
};

const isWorkoutLoggedByApp = (sample: WorkoutSample): boolean => {
    return (
        sample.sourceRevision?.source?.bundleIdentifier ===
        APP_BUNDLE_IDENTIFIER
    );
};

const formatActivityName = (activityType: WorkoutActivityType): string => {
    const activityLabel = WorkoutActivityType[activityType];
    return activityLabel != null
        ? activityLabel
              .replace(/([a-z])([A-Z])/g, "$1 $2")
              .replace(/_/g, " ")
              .split(" ")
              .filter((word) => word.length > 0)
              .map(
                  (word) =>
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ")
        : "Workout";
};
