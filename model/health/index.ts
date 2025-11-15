import { Platform } from "react-native";
import {
    isHealthDataAvailableAsync,
    requestAuthorization,
    saveWorkoutSample,
    WorkoutActivityType,
    WorkoutTypeIdentifier,
} from "@kingstinct/react-native-healthkit";

export interface StrengthWorkoutPayload {
    startDate: Date;
    endDate: Date;
    calories?: number;
}

let initPromise: Promise<boolean> | null = null;

const ensureHealthKit = async (): Promise<boolean> => {
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
                toRead: [],
            });
            return true;
        } catch (error) {
            console.warn("HealthKit authorization failed", error);
            return false;
        }
    })();

    return initPromise;
};

export const logStrengthWorkout = async (
    payload: StrengthWorkoutPayload
): Promise<boolean> => {
    const canUseHealthKit = await ensureHealthKit();
    if (!canUseHealthKit) {
        return false;
    }

    try {
        await saveWorkoutSample(
            WorkoutActivityType.traditionalStrengthTraining,
            [], // Quantities omitted for now
            payload.startDate,
            payload.endDate
        );
        return true;
    } catch (error) {
        console.warn("Failed to save workout to HealthKit", error);
        return false;
    }
};
