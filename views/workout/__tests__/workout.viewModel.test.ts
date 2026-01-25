import type { Exercise, ExerciseDef, Workout } from "../../../model/types";
import {
    createInitialWorkoutViewModelState,
    createWorkoutViewModelCore,
    createWorkoutViewModelState,
} from "../workout.viewModel.core";

type Overrides = Partial<{
    baseWorkout: Workout;
    generateGuid: () => string;
    prefillExerciseFromHistory: (
        exerciseId: string,
        exercise: Exercise
    ) => Promise<Exercise>;
    updateExerciseDef: (exerciseId: string, def: ExerciseDef) => Promise<void>;
    deleteExerciseDef: (exerciseDefId: string) => Promise<string>;
    mergeExerciseDefs: (
        targetExerciseDefId: string,
        sourceExerciseDefIds: string[]
    ) => Promise<void>;
}>;

const createTestViewModel = (overrides?: Overrides) => {
    const fallbackWorkout: Workout = {
        id: "workout-1",
        name: "Workout",
        exercises: [],
        notes: "",
        type: "strength",
        metadata: {},
        startTimestamp: 0,
    };
    const baseWorkout = overrides?.baseWorkout ?? fallbackWorkout;

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
        deleteExerciseDef: async () => "unknown-def",
        mergeExerciseDefs: async () => undefined,
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

    it("deletes exercise def and replaces with unknown", async () => {
        const baseWorkout: Workout = {
            id: "workout-1",
            name: "Workout",
            exercises: [
                {
                    id: "exercise-1",
                    exerciseId: "exercise-def-1",
                    notes: [],
                    sets: [],
                },
                {
                    id: "exercise-2",
                    exerciseId: "exercise-def-2",
                    notes: [],
                    sets: [],
                },
            ],
            notes: "",
            type: "strength",
            metadata: {},
            startTimestamp: 0,
        };
        const deleteExerciseDef = jest.fn(async () => "unknown-def");
        const { state, vm } = createTestViewModel({
            baseWorkout,
            deleteExerciseDef,
        });

        await vm.deleteExerciseDef("exercise-def-1");

        const workout = state.getState().workout;
        expect(workout.exercises).toHaveLength(2);
        expect(workout.exercises[0].exerciseId).toBe("unknown-def");
        expect(workout.exercises[1].exerciseId).toBe("exercise-def-2");
    });

    it("merges exercise definitions and reassigns them in workout", async () => {
        const baseWorkout: Workout = {
            id: "workout-1",
            name: "Workout",
            exercises: [
                {
                    id: "exercise-1",
                    exerciseId: "exercise-def-1",
                    notes: [],
                    sets: [],
                },
                {
                    id: "exercise-2",
                    exerciseId: "exercise-def-2",
                    notes: [],
                    sets: [],
                },
            ],
            notes: "",
            type: "strength",
            metadata: {},
            startTimestamp: 0,
        };
        const mergeExerciseDefs = jest.fn(async () => undefined);
        const { state, vm } = createTestViewModel({
            baseWorkout,
            mergeExerciseDefs,
        });

        await vm.mergeExerciseDefs("exercise-def-2", ["exercise-def-1"]);

        const workout = state.getState().workout;
        expect(workout.exercises[0].exerciseId).toBe("exercise-def-2");
        expect(workout.exercises[1].exerciseId).toBe("exercise-def-2");
    });
});
