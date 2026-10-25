import type { Set } from "../../../model/types";
import { calculateEpley1RM } from "../workout.calculations";

const CHART_RANGE_MONTHS = 6;

export type ExerciseHistoryEntry = {
    workoutId: string;
    finishedAt: number;
    note?: string | null;
    sets: Set[];
};

export type ExerciseHistoryMetric = "top" | "1rm";

export type ExerciseHistoryChartPoint = {
    workoutId: string;
    finishedAt: number;
    value: number;
};

type ExerciseHistoryState = {
    displayHistorySets: ExerciseHistoryEntry[];
    comparisonHistorySets: ExerciseHistoryEntry[];
    hasMore: boolean;
};

export const buildExerciseHistoryState = (
    entries: ExerciseHistoryEntry[],
    displayLimit: number
): ExerciseHistoryState => {
    const safeLimit = Math.max(displayLimit, 0);
    const displayHistorySets = entries.slice(0, safeLimit);
    const comparisonHistorySets = entries.slice(0, safeLimit + 1);
    const hasMore = entries.length > safeLimit;

    return {
        displayHistorySets,
        comparisonHistorySets,
        hasMore,
    };
};

export const buildExerciseHistoryChartPoints = (
    entries: ExerciseHistoryEntry[],
    now = Date.now(),
    metric: ExerciseHistoryMetric = "top"
): ExerciseHistoryChartPoint[] => {
    const rangeStart = subtractUtcMonthsClamped(now, CHART_RANGE_MONTHS);
    const pointsByWorkout = new Map<string, ExerciseHistoryChartPoint>();

    for (const entry of entries) {
        if (entry.finishedAt < rangeStart || entry.finishedAt > now) {
            continue;
        }

        const value = getMaximumSetValue(entry.sets, metric);
        if (value == null) {
            continue;
        }

        const existingPoint = pointsByWorkout.get(entry.workoutId);
        if (existingPoint != null && existingPoint.value >= value) {
            continue;
        }

        pointsByWorkout.set(entry.workoutId, {
            workoutId: entry.workoutId,
            finishedAt: entry.finishedAt,
            value,
        });
    }

    return Array.from(pointsByWorkout.values()).sort(
        (left, right) => left.finishedAt - right.finishedAt
    );
};

const getMaximumSetValue = (sets: Set[], metric: ExerciseHistoryMetric) =>
    sets.reduce<number | null>((maximum, set) => {
        if (set.type === "warmup") {
            return maximum;
        }

        const estimate =
            metric === "1rm"
                ? calculateEpley1RM(set.weight, set.reps)
                : Number.parseFloat(set.weight);
        if (estimate == null || !Number.isFinite(estimate) || estimate < 0) {
            return maximum;
        }

        return maximum == null ? estimate : Math.max(maximum, estimate);
    }, null);

const subtractUtcMonthsClamped = (timestamp: number, months: number) => {
    const result = new Date(timestamp);
    const day = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() - months);

    const lastDayOfTargetMonth = new Date(result);
    lastDayOfTargetMonth.setUTCMonth(lastDayOfTargetMonth.getUTCMonth() + 1);
    lastDayOfTargetMonth.setUTCDate(0);
    result.setUTCDate(Math.min(day, lastDayOfTargetMonth.getUTCDate()));

    return result.getTime();
};
