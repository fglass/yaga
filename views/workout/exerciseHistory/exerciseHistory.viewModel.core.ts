import type { Set } from "../../../model/types";

export type ExerciseHistoryEntry = {
    workoutId: string;
    finishedAt: number;
    sets: Set[];
};

type ExerciseHistoryState = {
    cleanedHistorySets: ExerciseHistoryEntry[];
    displayHistorySets: ExerciseHistoryEntry[];
    comparisonHistorySets: ExerciseHistoryEntry[];
    hasMore: boolean;
};

export const buildExerciseHistoryState = (
    entries: ExerciseHistoryEntry[],
    displayLimit: number
): ExerciseHistoryState => {
    const safeLimit = Math.max(displayLimit, 0);
    const cleanedHistorySets = entries
        .map((entry) => ({
            ...entry,
            sets: entry.sets.filter(
                (set) => set.weight.trim() !== "" || set.reps.trim() !== ""
            ),
        }))
        .filter((entry) => entry.sets.length > 0);
    const displayHistorySets = cleanedHistorySets.slice(0, safeLimit);
    const comparisonHistorySets = cleanedHistorySets.slice(0, safeLimit + 1);
    const hasMore = entries.length > safeLimit;

    return {
        cleanedHistorySets,
        displayHistorySets,
        comparisonHistorySets,
        hasMore,
    };
};
