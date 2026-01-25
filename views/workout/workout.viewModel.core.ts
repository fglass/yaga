import type { Exercise, ExerciseDef, Workout } from "../../model/types";
import { ActionType, workoutProducer } from "./workout.reducer";

export type WorkoutViewModelState = {
    workout: Workout;
};

export const createInitialWorkoutViewModelState = (
    initialWorkout: Workout
): WorkoutViewModelState => ({
    workout: initialWorkout,
});

export const createWorkoutViewModelState = (initial: WorkoutViewModelState) => {
    let state = initial;

    const getState = () => state;
    const setState = (
        updater: (prev: WorkoutViewModelState) => WorkoutViewModelState
    ) => {
        state = updater(state);
    };

    return { getState, setState };
};

type Deps = {
    generateGuid: () => string;
    prefillExerciseFromHistory: (
        exerciseId: string,
        exercise: Exercise
    ) => Promise<Exercise>;
    updateExerciseDef: (exerciseId: string, def: ExerciseDef) => Promise<void>;
};

export const createWorkoutViewModelCore = (params: {
    setState: (updater: (prev: WorkoutViewModelState) => WorkoutViewModelState) => void;
    deps: Deps;
}) => {
    const { setState, deps } = params;

    const onAddExercise = async (exerciseId: string) => {
        const newExercise: Exercise = {
            id: deps.generateGuid(),
            exerciseId,
            notes: [],
            sets: [
                {
                    id: deps.generateGuid(),
                    weight: "",
                    reps: "",
                    finishTime: undefined,
                },
            ],
        };
        const exercise = await deps.prefillExerciseFromHistory(
            exerciseId,
            newExercise
        );

        setState((state) => ({
            ...state,
            workout: workoutProducer(state.workout, {
                type: ActionType.AddExercise,
                exerciseId,
                exercise,
            }),
        }));
    };

    const updateExerciseDef = async (exerciseId: string, def: ExerciseDef) => {
        await deps.updateExerciseDef(exerciseId, def);
    };

    return {
        onAddExercise,
        updateExerciseDef,
    };
};
