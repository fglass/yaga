import { Set } from "../../model/types";

export type SetProgression = -1 | 0 | 1;

const E1RM_TOLERANCE = 0.01;

export const compareSetEpley1RM = (
    currentSet: Set,
    previousSet?: Set
): SetProgression => {
    if (!previousSet) {
        return 0;
    }

    const currentE1RM = calculateEpley1RM(currentSet.weight, currentSet.reps);
    const previousE1RM = calculateEpley1RM(
        previousSet.weight,
        previousSet.reps
    );

    if (currentE1RM == null || previousE1RM == null) {
        return 0;
    }

    const delta = currentE1RM - previousE1RM;
    if (Math.abs(delta) <= E1RM_TOLERANCE) {
        return 0;
    }

    return delta > 0 ? 1 : -1;
};

export const calculateEpley1RM = (
    weight: string,
    reps: string
): number | null => {
    const weightValue = Number.parseFloat(weight);
    const repsValue = Number.parseFloat(reps);

    if (!Number.isFinite(weightValue) || !Number.isFinite(repsValue)) {
        return null;
    }

    if (weightValue <= 0 || repsValue <= 0) {
        return null;
    }

    return weightValue * (1 + repsValue / 30);
};
