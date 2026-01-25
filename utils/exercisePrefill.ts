import { Exercise, Set } from "../model/types";
import { generateGuid } from "./guid";
import { fetchRecentSetsForExercises } from "../model/database";

export const prefillExerciseFromHistory = async (
    exerciseId: string,
    exercise: Exercise
): Promise<Exercise> => {
    const history = await fetchRecentSetsForExercises([exerciseId], 1);
    const latestSets = history[exerciseId]?.[0]?.sets;
    return applyPrefill(exercise, latestSets);
};

const applyPrefill = (exercise: Exercise, historySets?: Set[]): Exercise => {
    if (!historySets || historySets.length === 0) {
        return exercise;
    }

    const nextSets: Set[] = exercise.sets.map((set, idx) => {
        const historySet = historySets[idx];
        if (!historySet) {
            return set;
        }
        return createSetFromHistory(historySet);
    });

    for (let idx = exercise.sets.length; idx < historySets.length; idx += 1) {
        nextSets.push(createSetFromHistory(historySets[idx]));
    }

    return {
        ...exercise,
        sets: nextSets,
    };
};

const createSetFromHistory = (historySet: Set): Set => ({
    id: generateGuid(),
    weight: historySet.weight,
    reps: historySet.reps,
    finishTime: undefined,
});
