import type { Exercise, ExerciseDef, Workout } from "../../../model/types";
import {
    createInitialWorkoutViewModelState,
    createWorkoutViewModelCore,
    createWorkoutViewModelState,
} from "../workout.viewModel.core";

const createTestViewModel = (
    overrides?: Partial<{
        generateGuid: () => string;
        prefillExerciseFromHistory: (
            exerciseId: string,
            exercise: Exercise
        ) => Promise<Exercise>;
        updateExerciseDef: (exerciseId: string, def: ExerciseDef) => Promise<void>;
    }>
) => {
    const baseWorkout: Workout = {
        id: "workout-1",
        name: "Workout",
        exercises: [],
        notes: "",
        type: "strength",
        metadata: {},
        startTimestamp: 0,
    };
    const state = createWorkoutViewModelState(
        createInitialWorkoutViewModelState(baseWorkout)
    );
    const deps = {
        generateGuid: () => "id",
        prefillExerciseFromHistory: async (
            _exerciseId: string,
            exercise: Exercise
        ) => exercise,
        updateExerciseDef: async () => undefined,
        ...overrides,
    };
    const vm = createWorkoutViewModelCore({
        setState: state.setState,
        deps,
    });

    return { state, vm };
};

describe("workout view model core", () => {
    it("adds exercise to the workout", async () => {
        const idQueue = ["exercise-1", "set-1"];
        const { state, vm } = createTestViewModel({
            generateGuid: () => idQueue.shift() ?? "fallback",
        });

        await vm.onAddExercise("exercise-def-1");

        const workout = state.getState().workout;
        expect(workout.exercises).toHaveLength(1);
        expect(workout.exercises[0].exerciseId).toBe("exercise-def-1");
        expect(workout.exercises[0].sets[0].id).toBe("set-1");
    });

    it("updates exercise definitions", async () => {
        const updateExerciseDef = jest.fn(async () => undefined);
        const { vm } = createTestViewModel({ updateExerciseDef });

        const updatedDef: ExerciseDef = {
            name: "Bench Press",
            category: "Chest",
        };
        await vm.updateExerciseDef("exercise-1", updatedDef);

        expect(updateExerciseDef).toHaveBeenCalledWith(
            "exercise-1",
            updatedDef
        );
    });
});
