import { buildExerciseHistoryState } from "../exerciseHistory/exerciseHistory.viewModel.core";

const setFactory = (weight: string, reps: string) => ({
    id: `set-${weight}-${reps}`,
    weight,
    reps,
    type: "default" as const,
    finishTime: undefined,
});

const exerciseSetsEntryFactory = (
    workoutId: string,
    finishedAt: number,
    weight: string,
    reps: string
) => ({
    workoutId,
    finishedAt,
    sets: [setFactory(weight, reps)],
});

describe("buildExerciseHistoryState", () => {
    it("filters out empty sets and sessions", () => {
        const entries = [
            {
                workoutId: "workout-1",
                finishedAt: 1,
                sets: [setFactory("", ""), setFactory("0", "5")],
            },
            {
                workoutId: "workout-2",
                finishedAt: 2,
                sets: [setFactory("", "")],
            },
        ];

        const result = buildExerciseHistoryState(entries, 5);

        expect(result.displayHistorySets).toHaveLength(1);
        expect(result.displayHistorySets[0].sets).toHaveLength(1);
        expect(result.displayHistorySets[0].sets[0].weight).toBe("0");
    });

    it("exposes comparison sets and hasMore when over the limit", () => {
        const entries = Array.from({ length: 7 }, (_, index) =>
            exerciseSetsEntryFactory(
                `workout-${index + 1}`,
                index + 1,
                "10",
                "5"
            )
        );

        const result = buildExerciseHistoryState(entries, 5);

        expect(result.displayHistorySets).toHaveLength(5);
        expect(result.comparisonHistorySets).toHaveLength(6);
        expect(result.hasMore).toBe(true);
    });

    it("reports no more pages when within the limit", () => {
        const entries = Array.from({ length: 3 }, (_, index) =>
            exerciseSetsEntryFactory(
                `workout-${index + 1}`,
                index + 1,
                "10",
                "5"
            )
        );

        const result = buildExerciseHistoryState(entries, 5);

        expect(result.hasMore).toBe(false);
    });

    it("keeps hasMore true when filtered entries reduce the cleaned list", () => {
        const entries = [
            exerciseSetsEntryFactory("workout-1", 1, "", ""),
            exerciseSetsEntryFactory("workout-2", 2, "", ""),
            exerciseSetsEntryFactory("workout-3", 3, "", ""),
            exerciseSetsEntryFactory("workout-4", 4, "", ""),
            exerciseSetsEntryFactory("workout-5", 5, "", ""),
            exerciseSetsEntryFactory("workout-6", 6, "10", "5"),
        ];

        const result = buildExerciseHistoryState(entries, 5);

        expect(result.displayHistorySets).toHaveLength(1);
        expect(result.hasMore).toBe(true);
    });
});
