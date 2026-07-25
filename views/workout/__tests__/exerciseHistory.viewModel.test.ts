import {
    buildExerciseHistoryChartPoints,
    buildExerciseHistoryState,
} from "../exerciseHistory/exerciseHistory.viewModel.core";
import type { Set } from "../../../model/types";

const setFactory = (
    weight: string,
    reps: string,
    effortValue = ""
): Set => ({
    id: `set-${weight}-${reps}`,
    weight,
    reps,
    effortValue,
    effortUnit: "rpe" as const,
    type: "default" as const,
    finishTime: undefined,
});

const exerciseSetsEntryFactory = (
    workoutId: string,
    finishedAt: number,
    weight: string,
    reps: string,
    effortValue = ""
) => ({
    workoutId,
    finishedAt,
    sets: [setFactory(weight, reps, effortValue)],
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

    it("keeps RPE values on displayed history sets", () => {
        const entries = [
            exerciseSetsEntryFactory("workout-1", 1, "80", "5", "8.5"),
        ];

        const result = buildExerciseHistoryState(entries, 5);

        expect(result.displayHistorySets[0].sets[0].effortValue).toBe("8.5");
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

describe("buildExerciseHistoryChartPoints", () => {
    it("plots every workout from the last six months in chronological order", () => {
        const now = Date.UTC(2026, 6, 25);
        const entries = Array.from({ length: 7 }, (_, index) => ({
            workoutId: `workout-${index + 1}`,
            finishedAt: Date.UTC(2026, 6 - index, 25),
            sets: [
                setFactory(`${50 + index}`, "10"),
                setFactory(`${60 + index}`, "5"),
            ],
        }));
        entries.push({
            workoutId: "workout-old",
            finishedAt: Date.UTC(2026, 0, 24),
            sets: [setFactory("100", "5")],
        });

        const points = buildExerciseHistoryChartPoints(entries, now);

        expect(points).toHaveLength(7);
        expect(points.map((point) => point.workoutId)).toEqual([
            "workout-7",
            "workout-6",
            "workout-5",
            "workout-4",
            "workout-3",
            "workout-2",
            "workout-1",
        ]);
        expect(points.at(-1)?.estimatedOneRepMax).toBeCloseTo(70);
    });

    it("includes drop sets but ignores warmups and invalid estimates", () => {
        const entry = exerciseSetsEntryFactory(
            "workout-1",
            1,
            "80",
            "5"
        );
        entry.sets = [
            setFactory("", "5"),
            { ...setFactory("100", "3"), type: "drop" },
            { ...setFactory("200", "10"), type: "warmup" },
        ];

        const points = buildExerciseHistoryChartPoints([entry], 1);

        expect(points[0].estimatedOneRepMax).toBeCloseTo(110);
    });

    it("includes the last valid day when the six-month boundary month is shorter", () => {
        const now = Date.UTC(2026, 7, 31);
        const entries = [
            exerciseSetsEntryFactory(
                "workout-boundary",
                Date.UTC(2026, 1, 28),
                "100",
                "5"
            ),
            exerciseSetsEntryFactory(
                "workout-too-old",
                Date.UTC(2026, 1, 27),
                "100",
                "5"
            ),
        ];

        const points = buildExerciseHistoryChartPoints(entries, now);

        expect(points.map((point) => point.workoutId)).toEqual([
            "workout-boundary",
        ]);
    });

    it("combines repeated exercise entries from the same workout", () => {
        const now = Date.UTC(2026, 6, 25);
        const finishedAt = Date.UTC(2026, 6, 20);
        const entries = [
            exerciseSetsEntryFactory(
                "workout-1",
                finishedAt,
                "100",
                "3"
            ),
            exerciseSetsEntryFactory(
                "workout-1",
                finishedAt,
                "120",
                "2"
            ),
        ];

        const points = buildExerciseHistoryChartPoints(entries, now);

        expect(points).toEqual([
            {
                workoutId: "workout-1",
                finishedAt,
                estimatedOneRepMax: 128,
            },
        ]);
    });
});
