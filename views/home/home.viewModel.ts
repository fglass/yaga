import React from "react";
import * as DocumentPicker from "expo-document-picker";
import { useCompletedWorkouts } from "../../model/database";
import { useAppleHealthWorkouts } from "../../model/health/health.hooks";
import {
    getHealthLoggingEnabled,
    setHealthLoggingEnabled,
} from "../../model/health";
import {
    getStravaLoggingEnabled,
    setStravaLoggingEnabled,
    getAccessToken,
} from "../../model/strava";
import { dedupeWorkoutsByStart, parseWorkoutTimestamp } from "../../utils/util";

export const useHomeViewModel = () => {
    const [isHealthLoggingEnabled, setHealthLoggingEnabledState] = React.useState(
        getHealthLoggingEnabled()
    );
    const [isStravaLoggingEnabled, setStravaLoggingEnabledState] = React.useState(
        getStravaLoggingEnabled()
    );
    const [isImportVisible, setImportVisible] = React.useState(false);
    const [importFileUri, setImportFileUri] = React.useState<string | null>(null);
    const [importFileName, setImportFileName] = React.useState<string | null>(null);

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

    const toggleHealthLogging = () => {
        const next = !isHealthLoggingEnabled;
        setHealthLoggingEnabledState(next);
        setHealthLoggingEnabled(next);
        alert(`Apple Health logging ${next ? "enabled" : "disabled"}`);
    };

    const toggleStravaLogging = () => {
        const next = !isStravaLoggingEnabled;
        setStravaLoggingEnabledState(next);
        setStravaLoggingEnabled(next);
        alert(`Strava logging ${next ? "enabled" : "disabled"}`);
    };

    const authStrava = async () => {
        const token = await getAccessToken();
        alert(token ? "Strava auth successful" : "Strava auth failed");
    };

    const openImportFromStrong = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            type: "*/*",
        });

        if (result.canceled) {
            return;
        }

        const file = result.assets?.[0];
        if (!file?.uri) {
            return;
        }

        setImportFileUri(file.uri);
        setImportFileName(file.name ?? null);
        setImportVisible(true);
    };

    const closeImportFromStrong = () => {
        setImportVisible(false);
        setImportFileUri(null);
        setImportFileName(null);
    };

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
        isHealthLoggingEnabled,
        isStravaLoggingEnabled,
        toggleHealthLogging,
        toggleStravaLogging,
        authStrava,
        isImportVisible,
        importFileUri,
        importFileName,
        openImportFromStrong,
        closeImportFromStrong,
    };
};

type PeriodStats = {
    week: {
        current: number;
        previous: number;
    };
    month: {
        current: number;
        previous: number;
    };
    year: {
        current: number;
        previous: number;
    };
};

export const computePeriodStats = <
    T extends {
        startDate: Date;
        endDate: Date;
    }
>(
    workouts: T[],
    getValue: (workout: T) => number,
    referenceDate: Date = new Date()
): PeriodStats => {
    const {
        startOfWeek,
        startOfMonth,
        startOfYear,
        previousWeekStart,
        previousMonthStart,
        previousYearStart,
    } = getPeriodBoundaries(referenceDate);

    return workouts.reduce(
        (acc, workout) => {
            const completedDate = workout.endDate ?? workout.startDate;
            const rawValue = getValue(workout);
            const value = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;

            if (completedDate >= startOfWeek) {
                acc.week.current += value;
            } else if (
                completedDate >= previousWeekStart &&
                completedDate < startOfWeek
            ) {
                acc.week.previous += value;
            }

            if (completedDate >= startOfMonth) {
                acc.month.current += value;
            } else if (
                completedDate >= previousMonthStart &&
                completedDate < startOfMonth
            ) {
                acc.month.previous += value;
            }

            if (completedDate >= startOfYear) {
                acc.year.current += value;
            } else if (
                completedDate >= previousYearStart &&
                completedDate < startOfYear
            ) {
                acc.year.previous += value;
            }

            return acc;
        },
        {
            week: { current: 0, previous: 0 },
            month: { current: 0, previous: 0 },
            year: { current: 0, previous: 0 },
        }
    );
};

const getPeriodBoundaries = (reference: Date) => {
    const startOfWeek = getStartOfWeek(reference);
    const startOfMonth = new Date(
        reference.getFullYear(),
        reference.getMonth(),
        1
    );
    const startOfYear = new Date(reference.getFullYear(), 0, 1);
    const previousWeekStart = addDays(startOfWeek, -7);
    const previousMonthStart = new Date(
        reference.getFullYear(),
        reference.getMonth() - 1,
        1
    );
    const previousYearStart = new Date(reference.getFullYear() - 1, 0, 1);

    return {
        startOfWeek,
        startOfMonth,
        startOfYear,
        previousWeekStart,
        previousMonthStart,
        previousYearStart,
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

const formatDistance = (distance: number) => {
    if (!Number.isFinite(distance)) {
        return "0";
    }

    const normalized = Math.max(0, distance);

    if (normalized < 100) {
        return normalized.toFixed(1);
    }

    return `${Math.floor(normalized)}`;
};
