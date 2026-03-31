import { buildExerciseHistoryState } from "../exerciseHistory/exerciseHistory.viewModel.core";

const setFactory = (weight: string, reps: string) => ({
    id: `set-${weight}-${reps}`,
    weight,
    reps,
    effortValue: "",
    effortUnit: "rpe" as const,
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
    it("returns all entries when under the limit", () => {
        const entries = [
            exerciseSetsEntryFactory("workout-1", 1, "0", "5"),
            exerciseSetsEntryFactory("workout-2", 2, "10", "8"),
        ];

        const result = buildExerciseHistoryState(entries, 5);

        expect(result.displayHistorySets).toHaveLength(2);
        expect(result.displayHistorySets[0].sets[0].weight).toBe("0");
        expect(result.displayHistorySets[1].sets[0].weight).toBe("10");
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

    it("does not provide comparison entries for the last visible workout", () => {
        const entries = Array.from({ length: 3 }, (_, index) =>
            exerciseSetsEntryFactory(
                `workout-${index + 1}`,
                index + 1,
                "10",
                "5"
            )
        );

        const result = buildExerciseHistoryState(entries, 3);

        expect(result.displayHistorySets).toHaveLength(3);
        expect(result.comparisonHistorySets).toHaveLength(3);
        expect(result.comparisonHistorySets[3]).toBeUndefined();
    });

    it("keeps hasMore true when entries exceed the limit", () => {
        const entries = [
            exerciseSetsEntryFactory("workout-1", 1, "10", "5"),
            exerciseSetsEntryFactory("workout-2", 2, "10", "5"),
            exerciseSetsEntryFactory("workout-3", 3, "10", "5"),
            exerciseSetsEntryFactory("workout-4", 4, "10", "5"),
            exerciseSetsEntryFactory("workout-5", 5, "10", "5"),
            exerciseSetsEntryFactory("workout-6", 6, "10", "5"),
        ];

        const result = buildExerciseHistoryState(entries, 5);

        expect(result.displayHistorySets).toHaveLength(5);
        expect(result.hasMore).toBe(true);
    });
});
