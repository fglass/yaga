import { Exercise, Set } from "../model/types";
import { generateGuid } from "./guid";
import { fetchExerciseSetsFromCompletedWorkouts } from "../model/database";

type PrefillExerciseOptions = {
    matchHistorySetCount: boolean;
};

export const prefillExerciseFromHistory = async (
    exerciseId: string,
    exercise: Exercise,
    options: PrefillExerciseOptions
): Promise<Exercise> => {
    const history = await fetchExerciseSetsFromCompletedWorkouts(
        [exerciseId],
        1
    );
    const latestSets = history[exerciseId]?.[0]?.sets;
    return applyPrefill(exercise, latestSets, options);
};

export const applyPrefill = (
    exercise: Exercise,
    historySets: Set[] | undefined,
    options: PrefillExerciseOptions
): Exercise => {
    if (!historySets || historySets.length === 0) {
        return exercise;
    }

    const nextSets: Set[] = options.matchHistorySetCount
        ? historySets.map(createSetFromHistory)
        : exercise.sets.map((set, idx) => {
              const historySet = historySets[idx];
              if (!historySet) {
                  return set;
              }
              return createSetFromHistory(historySet);
          });

    return {
        ...exercise,
        sets: nextSets,
    };
};

export const getNextSetPrefill = (
    currentSets: Set[],
    historySets: Set[] | undefined
): Set | undefined => {
    if (!historySets || historySets.length === 0) {
        return undefined;
    }

    const nextNonWarmupSetIdx = currentSets.filter(
        (set) => set.type !== "warmup"
    ).length;
    const historyMatchingSet = historySets.filter(
        (set) => set.type !== "warmup"
    )[nextNonWarmupSetIdx];

    if (!historyMatchingSet) {
        return undefined;
    }

    return historyMatchingSet;
};

const createSetFromHistory = (historySet: Set): Set => ({
    id: generateGuid(),
    weight: historySet.weight,
    reps: historySet.reps,
    type: historySet.type,
    finishTime: undefined,
});
