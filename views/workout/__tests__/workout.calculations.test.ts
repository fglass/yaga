import { compareSetEpley1RM, calculateEpley1RM } from "../workout.calculations";

const setFactory = (weight: string, reps: string) => ({
    id: "set-1",
    weight,
    reps,
    finishTime: undefined,
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
