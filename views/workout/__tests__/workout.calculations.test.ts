import type { Set, Workout } from "../../../model/types";
import {
    compareSetEpley1RM,
    calculateEpley1RM,
    findPreviousFinishedSetTime,
    getSetProgress,
} from "../workout.calculations";

const setFactory = (weight: string, reps: string, type: Set["type"] = "default"): Set => ({
    id: "set-1",
    weight,
    reps,
    type,
    finishTime: undefined,
});

const workoutFactory = (
    exerciseFinishTimes: Array<Array<number | undefined>>
): Workout => ({
    id: "workout-1",
    name: "Workout",
    notes: "",
    type: "strength",
    metadata: {},
    startTimestamp: 0,
    exercises: exerciseFinishTimes.map((setFinishTimes, exerciseIdx) => ({
        id: `exercise-${exerciseIdx}`,
        exerciseId: `exercise-def-${exerciseIdx}`,
        notes: [],
        sets: setFinishTimes.map((finishTime, setIdx) => ({
            id: `set-${exerciseIdx}-${setIdx}`,
            weight: "",
            reps: "",
            type: "default" as const,
            finishTime,
        })),
    })),
});

describe("calculateEpley1RM", () => {
    it("returns null for missing inputs", () => {
        expect(calculateEpley1RM("", "10")).toBeNull();
        expect(calculateEpley1RM("100", "")).toBeNull();
    });

    it("calculates the Epley estimate", () => {
        expect(calculateEpley1RM("100", "5")).toBeCloseTo(116.6667, 4);
    });

    it("returns zero for bodyweight entries", () => {
        expect(calculateEpley1RM("0", "5")).toBe(0);
    });
});

describe("compareSetEpley1RM", () => {
    it("returns improved when the estimate increases", () => {
        const previous = setFactory("100", "5");
        const current = setFactory("105", "5");

        expect(compareSetEpley1RM(current, previous)).toBe(1);
    });

    it("returns declined when the estimate decreases", () => {
        const previous = setFactory("100", "5");
        const current = setFactory("95", "5");

        expect(compareSetEpley1RM(current, previous)).toBe(-1);
    });

    it("returns none when unchanged or missing", () => {
        const previous = setFactory("100", "5");
        const same = setFactory("100", "5");

        expect(compareSetEpley1RM(same, previous)).toBe(0);
        expect(compareSetEpley1RM(same)).toBe(0);
        expect(compareSetEpley1RM(setFactory("", "5"), previous)).toBe(0);
    });

    it("treats zero-weight previous sets as a baseline", () => {
        const previous = setFactory("0", "10");
        const current = setFactory("10", "10");

        expect(compareSetEpley1RM(current, previous)).toBe(1);
    });

    it("compares reps when both weights are zero", () => {
        const previous = setFactory("0", "10");
        const currentLess = setFactory("0", "8");
        const currentMore = setFactory("0", "12");

        expect(compareSetEpley1RM(currentLess, previous)).toBe(-1);
        expect(compareSetEpley1RM(currentMore, previous)).toBe(1);
    });
});

describe("findPreviousFinishedSetTime", () => {
    it("uses finish-time order instead of workout order", () => {
        const workout = workoutFactory([[4], [2, 5]]);

        expect(findPreviousFinishedSetTime(workout, 1, 1)).toBe(4);
    });

    it("skips unfinished sets and finds the nearest earlier finished set by time", () => {
        const workout = workoutFactory([
            [1, undefined, 3],
            [undefined, undefined, 6],
        ]);

        expect(findPreviousFinishedSetTime(workout, 1, 2)).toBe(3);
    });

    it("returns null when no earlier set has been finished before", () => {
        const workout = workoutFactory([[3], [2]]);

        expect(findPreviousFinishedSetTime(workout, 1, 0)).toBeNull();
    });
});

describe("getSetProgress", () => {
    it("ignores warmup sets", () => {
        const currentSets = [
            setFactory("20", "10", "warmup"),
            setFactory("100", "5"),
        ];
        const previousSets = [setFactory("95", "5")];

        expect(
            getSetProgress(previousSets, currentSets, 0)
        ).toBe(0);
    });

    it("matches default sets by default-set index, not raw set index", () => {
        const currentSets = [
            setFactory("20", "10", "warmup"),
            setFactory("100", "5"),
            setFactory("90", "6"),
        ];

        const previousSets = [
            setFactory("15", "12", "warmup"),
            setFactory("95", "5"),
            setFactory("90", "5"),
        ];

        expect(
            getSetProgress(previousSets, currentSets, 1)
        ).toBe(1);
        expect(
            getSetProgress(previousSets, currentSets, 2)
        ).toBe(1);
    });
});
