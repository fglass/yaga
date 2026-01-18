import { ExerciseDef } from "../../../model/types";
import {
    createImportViewModelCore,
    createImportViewModelState,
    createInitialImportViewModelState,
} from "../import.viewModel.core";
import { inferExerciseCategory } from "../import.viewModel.helpers";

const createTestViewModel = () => {
    const exerciseDefs: Record<string, ExerciseDef> = {
        benchPressId: { name: "Bench Press", category: "Chest" },
        pushUpId: { name: "Push Up", category: "Chest" },
        bicepCurlId: { name: "Bicep Curl", category: "Other" },
    };

    const { getState, setState } = createImportViewModelState({
        ...createInitialImportViewModelState(),
        stage: "mapping",
        importData: {
            rows: [],
            workouts: [],
            exerciseNames: ["Bench Press"],
            workoutCount: 1,
        },
        summary: {
            totalRows: 1,
            workoutCount: 1,
            knownExercises: 1,
            unknownExercises: 0,
            skippedExercises: 0,
        },
        unknownExercises: [],
        knownExercises: ["Bench Press"],
        knownMatches: { "Bench Press": "benchPressId" },
        mapping: {},
        exerciseDefs,
    });

    const deps = {
        fetchExerciseDefs: async () => exerciseDefs,
        readFileText: async () => "",
        requiredColumns: ["col"],
        parseStrongCsv: () => ({ rows: [], errors: [], totalRows: 0 }),
        buildImportData: () => ({
            rows: [],
            workouts: [],
            exerciseNames: [],
            workoutCount: 0,
        }),
        matchExerciseName: () => null,
        suggestExerciseMatches: () => [],
        importedBy: "strong-csv",
        importWorkouts: async () => ({
            workoutsAdded: 0,
            workoutsSkipped: 0,
            newExerciseDefs: 0,
        }),
        inferExerciseCategory: () => null,
        alert: jest.fn(),
        invalidateQueries: jest.fn(),
        queryKeys: {
            completedWorkouts: ["CompletedWorkouts"],
            exerciseDefs: ["ExerciseDefs"],
        },
    };

    return {
        getState,
        vm: createImportViewModelCore({
            getState,
            setState,
            deps,
            onClose: jest.fn(),
        }),
    };
};

describe("importViewModel", () => {
    it("maps to new exercise", () => {
        const { vm, getState } = createTestViewModel();
        const newExerciseId = "pushUpId";
        
        vm.setExerciseToExisting("Bench Press", newExerciseId);

        const state = getState();
        expect(state.mapping["Bench Press"]).toEqual({
            type: "existing",
            exerciseDefId: newExerciseId,
        });
        expect(vm.getKnownLabel("Bench Press")).toBe("Push Up");
        expect(vm.getKnownCategory("Bench Press")).toBe("Chest");
    });

    it("sets new with new name", () => {
        const { vm, getState } = createTestViewModel();

        vm.setExerciseAsNew("Bench Press", "New Name",);

        const state = getState();
        expect(state.mapping["Bench Press"]).toEqual({
            type: "create",
            name: "New Name",
            category: "Other",
        });
        expect(vm.getMappedLabel("Bench Press")).toBe("New Name");
        expect(vm.getMappedCategory("Bench Press")).toBe("Other");
    });

    it("sets new with new category", () => {
        const { vm, getState } = createTestViewModel();

        vm.setExerciseAsNew("Bench Press", undefined, "Legs");

        const state = getState();
        expect(state.mapping["Bench Press"]).toEqual({
            type: "create",
            name: "Bench Press",
            category: "Legs",
        });
        expect(vm.getMappedCategory("Bench Press")).toBe("Legs");
    });

    it("skips exercise", () => {
        const { vm, getState } = createTestViewModel();

        vm.skipExercise("Bench Press");

        const state = getState();
        expect(state.mapping["Bench Press"]).toEqual({ type: "skip" });
        expect(vm.getMappedLabel("Bench Press")).toBe("Skip");
        expect(state.knownExercises).not.toContain("Bench Press");
        expect(state.unknownExercises[0]).toBe("Bench Press");
    });

    it.each([
        ["Pull Up", "Back"],
        ["Bench Press", "Chest"],
        ["Goblet Squat", "Legs"],
        ["Cable Crunch", "Core"],
        ["Mystery Move", null],
    ])("infers exercise category for %s", (name, expected) => {
        expect(inferExerciseCategory(name)).toBe(expected);
    });
});
