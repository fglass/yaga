import type { Exercise, ExerciseDef, Workout } from "../../../model/types";
import {
    createInitialWorkoutViewModelState,
    createWorkoutViewModelCore,
    createWorkoutViewModelState,
} from "../workout.viewModel.core";
import { ActionType, workoutProducer } from "../workout.reducer";
import { createLatestTaskQueue } from "../workout.saveQueue";

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

describe("workout view model", () => {
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
        expect(workout.exercises[0].sets[0].type).toBe("default");
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

describe("workout latest save queue", () => {
    it("coalesces intermediate saves while a save is in flight", async () => {
        const started: string[] = [];
        const finished: string[] = [];
        const resolvers = new Map<string, () => void>();

        const queue = createLatestTaskQueue<string>(
            (label: string) =>
                new Promise<void>((resolve) => {
                    started.push(label);
                    resolvers.set(label, () => {
                        finished.push(label);
                        resolve();
                    });
                })
        );

        void queue.enqueue("first");
        await Promise.resolve();
        await Promise.resolve();
        expect(started).toEqual(["first"]);

        void queue.enqueue("second");
        void queue.enqueue("third");
        expect(started).toEqual(["first"]);

        resolvers.get("first")?.();
        await Promise.resolve();
        await Promise.resolve();
        expect(started).toEqual(["first", "third"]);

        resolvers.get("third")?.();
        await queue.flush();
        expect(finished).toEqual(["first", "third"]);
    });
});

describe("workout reducer", () => {
    it("copies a finished set onto the current unfinished set", () => {
        const workout: Workout = {
            id: "workout-1",
            name: "Workout",
            exercises: [
                {
                    id: "exercise-1",
                    exerciseId: "exercise-def-1",
                    notes: [],
                    sets: [
                        {
                            id: "set-1",
                            weight: "100",
                            reps: "8",
                            type: "drop",
                            finishTime: 1,
                        },
                        {
                            id: "set-2",
                            weight: "",
                            reps: "",
                            type: "default",
                            finishTime: undefined,
                        },
                    ],
                },
            ],
            notes: "",
            type: "strength",
            metadata: {},
            startTimestamp: 0,
        };

        const nextWorkout = workoutProducer(workout, {
            type: ActionType.CopyToCurrentSet,
            exerciseIdx: 0,
            setIdx: 0,
        });

        expect(nextWorkout.exercises[0].sets[1]).toMatchObject({
            weight: "100",
            reps: "8",
            type: "drop",
        });
    });

    it("copies the previous set onto the tapped set", () => {
        const workout: Workout = {
            id: "workout-1",
            name: "Workout",
            exercises: [
                {
                    id: "exercise-1",
                    exerciseId: "exercise-def-1",
                    notes: [],
                    sets: [
                        {
                            id: "set-1",
                            weight: "100",
                            reps: "8",
                            type: "drop",
                            finishTime: 1,
                        },
                        {
                            id: "set-2",
                            weight: "",
                            reps: "",
                            type: "default",
                            finishTime: undefined,
                        },
                        {
                            id: "set-3",
                            weight: "70",
                            reps: "12",
                            type: "warmup",
                            finishTime: 2,
                        },
                    ],
                },
            ],
            notes: "",
            type: "strength",
            metadata: {},
            startTimestamp: 0,
        };

        const nextWorkout = workoutProducer(workout, {
            type: ActionType.CopyPreviousSet,
            exerciseIdx: 0,
            setIdx: 2,
        });

        expect(nextWorkout.exercises[0].sets[2]).toMatchObject({
            id: "set-3",
            weight: "",
            reps: "",
            type: "default",
            finishTime: 2,
        });
    });

    it("does nothing when there is no previous set", () => {
        const workout: Workout = {
            id: "workout-1",
            name: "Workout",
            exercises: [
                {
                    id: "exercise-1",
                    exerciseId: "exercise-def-1",
                    notes: [],
                    sets: [
                        {
                            id: "set-1",
                            weight: "100",
                            reps: "8",
                            type: "drop",
                            finishTime: 1,
                        },
                    ],
                },
            ],
            notes: "",
            type: "strength",
            metadata: {},
            startTimestamp: 0,
        };

        const nextWorkout = workoutProducer(workout, {
            type: ActionType.CopyPreviousSet,
            exerciseIdx: 0,
            setIdx: 0,
        });

        expect(nextWorkout).toEqual(workout);
    });
});
