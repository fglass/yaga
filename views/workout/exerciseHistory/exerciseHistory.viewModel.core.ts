import type { Set } from "../../../model/types";
import { calculateEpley1RM } from "../workout.calculations";

const CHART_RANGE_MONTHS = 6;

export type ExerciseHistoryEntry = {
    workoutId: string;
    finishedAt: number;
    note?: string | null;
    sets: Set[];
};

export type ExerciseHistoryChartPoint = {
    workoutId: string;
    finishedAt: number;
    estimatedOneRepMax: number;
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
    now = Date.now()
): ExerciseHistoryChartPoint[] => {
    const rangeStart = subtractUtcMonthsClamped(now, CHART_RANGE_MONTHS);
    const pointsByWorkout = new Map<string, ExerciseHistoryChartPoint>();

    for (const entry of entries) {
        if (entry.finishedAt < rangeStart || entry.finishedAt > now) {
            continue;
        }

        const estimatedOneRepMax = getEstimated1RM(entry.sets);
        if (estimatedOneRepMax == null) {
            continue;
        }

        const existingPoint = pointsByWorkout.get(entry.workoutId);
        if (
            existingPoint != null &&
            existingPoint.estimatedOneRepMax >= estimatedOneRepMax
        ) {
            continue;
        }

        pointsByWorkout.set(entry.workoutId, {
            workoutId: entry.workoutId,
            finishedAt: entry.finishedAt,
            estimatedOneRepMax,
        });
    }

    return Array.from(pointsByWorkout.values()).sort(
        (left, right) => left.finishedAt - right.finishedAt
    );
};

const getEstimated1RM = (sets: Set[]) =>
    sets.reduce<number | null>((maximum, set) => {
        if (set.type === "warmup") {
            return maximum;
        }

        const estimate = calculateEpley1RM(set.weight, set.reps);
        if (estimate == null) {
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
