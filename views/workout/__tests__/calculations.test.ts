import { compareSetEpley1RM, calculateEpley1RM } from "../calculations";

const makeSet = (weight: string, reps: string) => ({
    id: "set-1",
    weight,
    reps,
    finishTime: undefined,
});

describe("calculateEpley1RM", () => {
    it("returns null for missing inputs", () => {
        expect(calculateEpley1RM("", "10")).toBeNull();
        expect(calculateEpley1RM("100", "")).toBeNull();
        expect(calculateEpley1RM("0", "5")).toBeNull();
    });

    it("calculates the Epley estimate", () => {
        expect(calculateEpley1RM("100", "5")).toBeCloseTo(116.6667, 4);
    });
});

describe("compareSetEpley1RM", () => {
    it("returns improved when the estimate increases", () => {
        const previous = makeSet("100", "5");
        const current = makeSet("105", "5");

        expect(compareSetEpley1RM(current, previous)).toBe(1);
    });

    it("returns declined when the estimate decreases", () => {
        const previous = makeSet("100", "5");
        const current = makeSet("95", "5");

        expect(compareSetEpley1RM(current, previous)).toBe(-1);
    });

    it("returns none when unchanged or missing", () => {
        const previous = makeSet("100", "5");
        const same = makeSet("100", "5");

        expect(compareSetEpley1RM(same, previous)).toBe(0);
        expect(compareSetEpley1RM(same)).toBe(0);
        expect(compareSetEpley1RM(makeSet("", "5"), previous)).toBe(0);
    });
});
