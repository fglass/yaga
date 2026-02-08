import { Set, Workout } from "../../model/types";

export type SetProgression = -1 | 0 | 1;

const E1RM_TOLERANCE = 0.01;

export const getSetProgress = (
    previousSets: Set[] | undefined,
    currentSets: Set[],
    setIdx: number
): SetProgression => {
    const currentSet = currentSets[setIdx];
    if (!currentSet || currentSet.type === "warmup") {
        return 0;
    }

    const currentDefaultSetIdx =
        currentSets
            .slice(0, setIdx + 1)
            .filter((set) => set.type !== "warmup").length - 1;

    if (currentDefaultSetIdx < 0) {
        return 0;
    }

    const previousSet = previousSets?.filter((set) => set.type !== "warmup")?.[
        currentDefaultSetIdx
    ];

    return compareSetEpley1RM(currentSet, previousSet);
};

export const compareSetEpley1RM = (
    currentSet: Set,
    previousSet?: Set
): SetProgression => {
    if (!previousSet) {
        return 0;
    }

    const currentWeightValue = Number.parseFloat(currentSet.weight);
    const previousWeightValue = Number.parseFloat(previousSet.weight);
    const currentRepsValue = Number.parseFloat(currentSet.reps);
    const previousRepsValue = Number.parseFloat(previousSet.reps);

    if (
        Number.isFinite(currentWeightValue) &&
        Number.isFinite(previousWeightValue) &&
        currentWeightValue === 0 &&
        previousWeightValue === 0 &&
        Number.isFinite(currentRepsValue) &&
        Number.isFinite(previousRepsValue)
    ) {
        const repsDelta = currentRepsValue - previousRepsValue;
        if (Math.abs(repsDelta) <= E1RM_TOLERANCE) {
            return 0;
        }

        return repsDelta > 0 ? 1 : -1;
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

    if (weightValue < 0 || repsValue <= 0) {
        return null;
    }

    return weightValue * (1 + repsValue / 30);
};

export const findPreviousFinishedSetTime = (
    workout: Workout,
    exerciseIdx: number,
    setIdx: number
): number | null => {
    const currentFinishTime =
        workout.exercises[exerciseIdx]?.sets[setIdx]?.finishTime;
    if (currentFinishTime === undefined) {
        return null;
    }

    const sortedFinishTimes = workout.exercises
        .flatMap((exercise) =>
            exercise.sets
                .map((set) => set.finishTime)
                .filter(
                    (finishTime): finishTime is number =>
                        finishTime !== undefined
                )
        )
        .sort((a, b) => a - b);

    for (
        let currentIdx = sortedFinishTimes.length - 1;
        currentIdx >= 0;
        currentIdx -= 1
    ) {
        const finishTime = sortedFinishTimes[currentIdx];
        if (finishTime < currentFinishTime) {
            return finishTime;
        }
    }

    return null;
};
