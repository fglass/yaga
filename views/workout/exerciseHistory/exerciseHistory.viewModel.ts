import { useCallback, useEffect, useMemo, useState } from "react";
import {
    useExerciseSetsFromCompletedWorkouts,
    type ExerciseSetsEntry,
} from "../workout.hooks";
import {
    buildExerciseHistoryChartPoints,
    buildExerciseHistoryState,
    type ExerciseHistoryChartPoint,
    type ExerciseHistoryEntry,
} from "./exerciseHistory.viewModel.core";

const DEFAULT_PAGE_SIZE = 5;

type Props = {
    exerciseId: string | null;
    isVisible: boolean;
    pageSize?: number;
};

type ViewModel = {
    isLoading: boolean;
    displayHistorySets: ExerciseHistoryEntry[];
    comparisonHistorySets: ExerciseHistoryEntry[];
    chartPoints: ExerciseHistoryChartPoint[];
    hasMore: boolean;
    loadMore: () => void;
};

export const useExerciseHistoryViewModel = ({
    exerciseId,
    isVisible,
    pageSize = DEFAULT_PAGE_SIZE,
}: Props): ViewModel => {
    const [pageCount, setPageCount] = useState(1);

    useEffect(() => {
        setPageCount(1);
    }, [exerciseId, isVisible]);

    const displayLimit = pageSize * pageCount;
    const { isLoading, historySets } = useExerciseSetsFromCompletedWorkouts({
        exerciseIds: exerciseId ? [exerciseId] : [],
        isEnabled: isVisible && exerciseId != null,
    });

    const rawEntries = useMemo(() => {
        if (!exerciseId) {
            return [];
        }
        return (historySets[exerciseId] ?? []) as ExerciseSetsEntry[];
    }, [exerciseId, historySets]);

    const { displayHistorySets, comparisonHistorySets, hasMore } = useMemo(
        () => buildExerciseHistoryState(rawEntries, displayLimit),
        [rawEntries, displayLimit]
    );
    const chartPoints = useMemo(
        () => buildExerciseHistoryChartPoints(rawEntries),
        [rawEntries]
    );

    const loadMore = useCallback(() => {
        if (!hasMore) {
            return;
        }
        setPageCount((prevCount) => prevCount + 1);
    }, [hasMore]);

    return {
        isLoading,
        displayHistorySets,
        comparisonHistorySets,
        chartPoints,
        hasMore,
        loadMore,
    };
};
