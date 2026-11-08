import { Platform } from "react-native";
import Constants from "expo-constants";
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
import { completeWorkout, fetchCompletedWorkoutIds } from "../database";
import { AppleHealthWorkout, CompletedWorkout, WorkoutType } from "../types";

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

interface SyncAppleHealthRunsDeps {
    completeWorkout: (workout: CompletedWorkout) => Promise<void>;
    fetchCompletedWorkoutIds: () => Promise<string[]>;
}

let initPromise: Promise<boolean> | null = null;
let isHealthLoggingEnabled = true;

type WorkoutProxyItem = Awaited<ReturnType<typeof queryWorkoutSamples>>[number];

const APPLE_HEALTH_IMPORTED_BY = "apple-health";
const APPLE_HEALTH_WORKOUT_ID_PREFIX = `${APPLE_HEALTH_IMPORTED_BY}:`;
const APP_BUNDLE_IDENTIFIER_PREFIX = "com.expench.yaga";
const MAX_CONCURRENT_DISTANCE_LOOKUPS = 4;

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
                initPromise = null;
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
            initPromise = null;
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

        const workouts: (AppleHealthWorkout | null)[] = new Array(
            workoutProxies.length
        ).fill(null);
        let nextIndex = 0;
        await Promise.all(
            Array.from(
                {
                    length: Math.min(
                        MAX_CONCURRENT_DISTANCE_LOOKUPS,
                        workoutProxies.length
                    ),
                },
                async () => {
                    while (nextIndex < workoutProxies.length) {
                        const index = nextIndex++;
                        const proxy = workoutProxies[index];
                        const sample = proxy.toJSON();
                        if (isWorkoutLoggedByYaga(sample)) {
                            continue;
                        }

                        const distance = await getRunDistance(
                            proxy,
                            sample.workoutActivityType
                        );
                        workouts[index] = asHealthWorkout(sample, distance);
                    }
                }
            )
        );

        const result = workouts
            .filter((workout): workout is AppleHealthWorkout => workout != null)
            .filter(dedupe());
        console.log(
            `Apple Health workouts fetched in ${Date.now() - startTime}ms`
        );
        return result;
    } catch (error) {
        console.warn("Failed to query Apple Health workouts", error);
        return [];
    }
};

export const syncAppleHealthRunsToDatabase = async (
    workouts: AppleHealthWorkout[],
    deps: SyncAppleHealthRunsDeps = {
        completeWorkout,
        fetchCompletedWorkoutIds,
    }
): Promise<number> => {
    const runWorkouts = workouts.filter(
        (workout) => workout.workoutType === "run"
    );

    if (runWorkouts.length === 0) {
        return 0;
    }

    const existingIds = new Set(await deps.fetchCompletedWorkoutIds());
    let insertedCount = 0;

    for (const workout of runWorkouts) {
        const completedWorkout = asCompletedRunWorkout(workout);
        if (existingIds.has(completedWorkout.id)) {
            continue;
        }

        await deps.completeWorkout(completedWorkout);
        existingIds.add(completedWorkout.id);
        insertedCount += 1;
    }

    console.log(`Apple Health inserted ${insertedCount} runs`);

    return insertedCount;
};

export const isAppleHealthImportedWorkout = (
    workout: CompletedWorkout
): boolean => workout.metadata?.importedBy === APPLE_HEALTH_IMPORTED_BY;

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

const asCompletedRunWorkout = (
    workout: AppleHealthWorkout
): CompletedWorkout => ({
    id: `${APPLE_HEALTH_WORKOUT_ID_PREFIX}${workout.id}`,
    name: workout.name || "Run",
    notes: "",
    type: "run",
    exercises: [],
    metadata: {
        importedBy: APPLE_HEALTH_IMPORTED_BY,
    },
    startTimestamp: workout.startDate.getTime(),
    endTimestamp: workout.endDate.getTime(),
    distance: workout.distance,
});

const isWorkoutLoggedByYaga = (sample: WorkoutSample): boolean => {
    const sourceBundleId = getSourceBundleIdentifier(sample);
    if (!sourceBundleId) {
        return false;
    }

    const appBundleId = Constants.expoConfig?.ios?.bundleIdentifier;
    if (typeof appBundleId === "string" && appBundleId.length > 0) {
        return sourceBundleId === appBundleId;
    }

    return sourceBundleId.startsWith(APP_BUNDLE_IDENTIFIER_PREFIX);
};

const getSourceBundleIdentifier = (sample: WorkoutSample): string | null => {
    const source = sample.sourceRevision?.source;
    if (!source) {
        return null;
    }

    if (typeof source.bundleIdentifier === "string") {
        return source.bundleIdentifier;
    }

    const toJson =
        typeof source.toJSON === "function" ? source.toJSON.bind(source) : null;
    if (!toJson) {
        return null;
    }

    const serialized = toJson();
    return typeof serialized.bundleIdentifier === "string"
        ? serialized.bundleIdentifier
        : null;
};
