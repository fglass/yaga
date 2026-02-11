import { Exercise, Set } from "../model/types";
import { generateGuid } from "./guid";
import { fetchExerciseSetsFromCompletedWorkouts } from "../model/database";

export const prefillExerciseFromHistory = async (
    exerciseId: string,
    exercise: Exercise
): Promise<Exercise> => {
    const history = await fetchExerciseSetsFromCompletedWorkouts(
        [exerciseId],
        1
    );
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

    return {
        ...exercise,
        sets: nextSets,
    };
};

const createSetFromHistory = (historySet: Set): Set => ({
    id: generateGuid(),
    weight: historySet.weight,
    reps: historySet.reps,
    type: historySet.type,
    finishTime: undefined,
});
