import type { Set } from "../../../model/types";

export type ExerciseHistoryEntry = {
    workoutId: string;
    finishedAt: number;
    note?: string | null;
    sets: Set[];
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
