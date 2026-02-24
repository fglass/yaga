import type { Set } from "../../model/types";
import { getNextSetPrefill } from "../exercisePrefill";

const setFactory = (
    weight: string,
    reps: string,
    type: Set["type"] = "default"
): Set => ({
    id: `${weight}-${reps}-${type}`,
    weight,
    reps,
    type,
    finishTime: undefined,
});

describe("getNextSetPrefill", () => {
    it("returns the matched non-warmup history set and ignores warmup sets", () => {
        const currentSets = [
            setFactory("45", "10", "warmup"),
            setFactory("100", "5", "default"),
        ];
        const historySets = [
            setFactory("45", "12", "warmup"),
            setFactory("95", "5", "default"),
            setFactory("80", "8", "drop"),
        ];

        expect(getNextSetPrefill(currentSets, historySets)).toEqual(
            setFactory("80", "8", "drop")
        );
    });

    it("returns undefined when history has no matching non-warmup set", () => {
        const currentSets = [
            setFactory("100", "5", "default"),
            setFactory("80", "8", "drop"),
        ];
        const historySets = [
            setFactory("95", "5", "default"),
            setFactory("75", "8", "drop"),
        ];

        expect(getNextSetPrefill(currentSets, historySets)).toBe(undefined);
    });
});
