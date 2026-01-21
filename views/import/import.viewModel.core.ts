import { Alert } from "react-native";
import {
    ExerciseMapping,
    ImportData,
    ImportParseResult,
    ImportRow,
} from "../../model/import/import.types";
import { ExerciseCategory, ExerciseDef } from "../../model/types";
import { inferExerciseCategory } from "./import.viewModel.helpers";

export interface ImportSummary {
    totalRows: number;
    workoutCount: number;
    knownExercises: number;
    unknownExercises: number;
    skippedExercises: number;
}

export type ImportStage = "idle" | "mapping" | "importing";

export interface ImportViewModelState {
    exerciseDefs: Record<string, ExerciseDef>;
    stage: ImportStage;
    importData: ImportData | null;
    summary: ImportSummary | null;
    unknownExercises: string[];
    knownExercises: string[];
    knownMatches: Record<string, string>;
    mapping: Record<string, ExerciseMapping | null>;
    selectedExercise: string | null;
    isSelectModalVisible: boolean;
    isCreateModalVisible: boolean;
}

export interface ImportViewModelDeps {
    fetchExerciseDefs: () => Promise<Record<string, ExerciseDef>>;
    readFileText: (uri: string) => Promise<string>;
    requiredColumns: string[];
    parseStrongCsv: (text: string) => ImportParseResult;
    buildImportData: (rows: ImportRow[]) => ImportData;
    matchExerciseName: (
        name: string,
        defs: Record<string, ExerciseDef>
    ) => string | null;
    suggestExerciseMatches: (
        name: string,
        defs: Record<string, ExerciseDef>
    ) => Array<{ id: string; name: string }>;
    importedBy: string;
    importWorkouts: (
        data: ImportData,
        mapping: Record<string, ExerciseMapping>,
        importedBy: string
    ) => Promise<{
        workoutsAdded: number;
        workoutsSkipped: number;
        newExerciseDefs: number;
    }>;
    inferExerciseCategory: typeof inferExerciseCategory;
    alert: typeof Alert.alert;
    invalidateQueries: (queryKey: unknown[]) => void;
    queryKeys: {
        completedWorkouts: unknown[];
        exerciseDefs: unknown[];
    };
}

export const createInitialImportViewModelState =
    (): ImportViewModelState => ({
        exerciseDefs: {},
        stage: "idle",
        importData: null,
        summary: null,
        unknownExercises: [],
        knownExercises: [],
        knownMatches: {},
        mapping: {},
        selectedExercise: null,
        isSelectModalVisible: false,
        isCreateModalVisible: false,
    });

const applySummaryCounts = (
    state: ImportViewModelState
): ImportViewModelState => {
    if (!state.summary) {
        return state;
    }

    const newCount = state.unknownExercises.filter(
        (name) => state.mapping[name]?.type !== "skip"
    ).length;
    const skippedCount = state.unknownExercises.filter(
        (name) => state.mapping[name]?.type === "skip"
    ).length;

    return {
        ...state,
        summary: {
            ...state.summary,
            knownExercises: state.knownExercises.length,
            unknownExercises: newCount,
            skippedExercises: skippedCount,
        },
    };
};

export const createImportViewModelState = (
    initial?: Partial<ImportViewModelState>
) => {
    let state: ImportViewModelState = {
        ...createInitialImportViewModelState(),
        ...initial,
    };

    const getState = () => state;
    const setState = (
        updater: (prev: ImportViewModelState) => ImportViewModelState
    ) => {
        state = applySummaryCounts(updater(state));
    };

    return { getState, setState };
};

export const createImportViewModelCore = ({
    getState,
    setState,
    deps,
    onClose,
}: {
    getState: () => ImportViewModelState;
    setState: (
        updater: (prev: ImportViewModelState) => ImportViewModelState
    ) => void;
    deps: ImportViewModelDeps;
    onClose: () => void;
}) => {
    const getDefaultCategory = (exerciseName: string): ExerciseCategory =>
        deps.inferExerciseCategory(exerciseName) ?? "Other";

    const loadCsv = async (uri: string) => {
        let currentDefs: Record<string, ExerciseDef> = {};
        try {
            currentDefs = await deps.fetchExerciseDefs();
        } catch {
            deps.alert(
                "Import not ready",
                "Exercise definitions could not be loaded."
            );
            return;
        }

        let csvText = "";
        try {
            csvText = await deps.readFileText(uri);
        } catch {
            deps.alert("Import failed", "Could not read the selected file.");
            onClose();
            return;
        }

        const parseResult = deps.parseStrongCsv(csvText);
        if (parseResult.errors.length > 0) {
            deps.alert(
                "Invalid CSV",
                `${parseResult.errors[0]}\nExpected columns: ${deps.requiredColumns.join(
                    ", "
                )}`
            );
            onClose();
            return;
        }

        const data = deps.buildImportData(parseResult.rows);
        const known: Record<string, string> = {};
        const unknown: string[] = [];
        data.exerciseNames.forEach((name) => {
            const match = deps.matchExerciseName(name, currentDefs);
            if (match) {
                known[name] = match;
            } else {
                unknown.push(name);
            }
        });

        const summaryData: ImportSummary = {
            totalRows: parseResult.totalRows,
            workoutCount: data.workoutCount,
            knownExercises: Object.keys(known).length,
            unknownExercises: unknown.length,
            skippedExercises: 0,
        };

        setState((prev) => ({
            ...prev,
            exerciseDefs: currentDefs,
            importData: data,
            knownMatches: known,
            knownExercises: Object.keys(known),
            unknownExercises: unknown,
            mapping: unknown.reduce<Record<string, ExerciseMapping | null>>(
                (acc, name) => {
                    acc[name] = null;
                    return acc;
                },
                {}
            ),
            summary: summaryData,
            stage: "mapping",
        }));
    };

    const openSelectModal = (exerciseName: string) => {
        setState((prev) => ({
            ...prev,
            selectedExercise: exerciseName,
            isSelectModalVisible: true,
        }));
    };

    const closeSelectModal = () => {
        setState((prev) => ({
            ...prev,
            selectedExercise: null,
            isSelectModalVisible: false,
        }));
    };

    const openCreateModal = () => {
        setState((prev) => ({ ...prev, isCreateModalVisible: true }));
    };

    const closeCreateModal = () => {
        setState((prev) => ({ ...prev, isCreateModalVisible: false }));
    };

    const removeExercise = (list: string[], exerciseName: string) =>
        list.filter((name) => name !== exerciseName);
    const addExerciseToFront = (list: string[], exerciseName: string) =>
        list.includes(exerciseName) ? list : [exerciseName, ...list];

    const setMappingForExercise = (
        exerciseName: string,
        value: ExerciseMapping
    ) => {
        setState((prev) => {
            const next = {
                ...prev,
                mapping: {
                    ...prev.mapping,
                    [exerciseName]: value,
                },
            };

            if (value.type === "skip") {
                return {
                    ...next,
                    knownExercises: removeExercise(
                        prev.knownExercises,
                        exerciseName
                    ),
                    unknownExercises: addExerciseToFront(
                        prev.unknownExercises,
                        exerciseName
                    ),
                };
            }

            return {
                ...next,
                unknownExercises: removeExercise(
                    prev.unknownExercises,
                    exerciseName
                ),
                knownExercises: addExerciseToFront(
                    prev.knownExercises,
                    exerciseName
                ),
            };
        });
    };

    const setExerciseAsNew = (
        exerciseName: string,
        name?: string,
        category?: ExerciseCategory
    ) => {
        setMappingForExercise(exerciseName, {
            type: "create",
            name: name ?? exerciseName,
            category: category ?? getDefaultCategory(exerciseName),
        });
        closeCreateModal();
        closeSelectModal();
    };

    const setExerciseToExisting = (exerciseName: string, toExerciseDefId: string) => {
        setMappingForExercise(exerciseName, {
            type: "existing",
            exerciseDefId: toExerciseDefId,
        });
        closeSelectModal();
    };

    const skipExercise = (exerciseName: string) => {
        setMappingForExercise(exerciseName, { type: "skip" });
        closeSelectModal();
    };

    const runImport = async () => {
        const { importData, mapping, knownMatches } = getState();
        if (!importData) {
            return;
        }

        const finalMapping: Record<string, ExerciseMapping> = {};
        importData.exerciseNames.forEach((name) => {
            const mapped = mapping[name];
            if (mapped) {
                finalMapping[name] = mapped;
                return;
            }

            const knownId = knownMatches[name];
            if (knownId) {
                finalMapping[name] = {
                    type: "existing",
                    exerciseDefId: knownId,
                };
                return;
            }

            finalMapping[name] = {
                type: "create",
                name,
                category: getDefaultCategory(name),
            };
        });

        setState((prev) => ({ ...prev, stage: "importing" }));
        try {
            const result = await deps.importWorkouts(
                importData,
                finalMapping,
                deps.importedBy
            );
            deps.invalidateQueries(deps.queryKeys.completedWorkouts);
            deps.invalidateQueries(deps.queryKeys.exerciseDefs);

            deps.alert(
                "Import Complete",
                `Workouts added: ${result.workoutsAdded}\nWorkouts skipped: ${result.workoutsSkipped}\nNew exercises: ${result.newExerciseDefs}`,
                [
                    {
                        text: "Done",
                        onPress: onClose,
                    },
                ]
            );
        } catch {
            deps.alert(
                "Import Failed",
                "Something went wrong while importing workouts."
            );
            setState((prev) => ({ ...prev, stage: "mapping" }));
        }
    };

    const getExerciseDef = (id?: string) => {
        const { exerciseDefs } = getState();
        return id ? exerciseDefs[id] : undefined;
    };

    const getExerciseDefName = (id: string | undefined, fallback: string) =>
        getExerciseDef(id)?.name ?? fallback;

    const getExerciseDefCategory = (id?: string) =>
        getExerciseDef(id)?.category ?? null;

    const getMappedLabel = (exerciseName: string): string => {
        const { mapping } = getState();
        const mapped = mapping[exerciseName];
        if (!mapped) {
            return "Unmapped";
        }

        switch (mapped.type) {
            case "skip":
                return "Skip";
            case "existing":
                return getExerciseDefName(mapped.exerciseDefId, "Existing");
            case "create":
                return mapped.name;
            default:
                return "Unmapped";
        }
    };

    const getMappedCategory = (
        exerciseName: string
    ): ExerciseCategory | null => {
        const { mapping } = getState();
        const mapped = mapping[exerciseName];
        if (mapped?.type === "create") {
            return mapped.category ?? "Other";
        }
        return null;
    };

    const getSuggestedCategory = (
        exerciseName: string
    ): ExerciseCategory | null => {
        const { mapping, knownMatches } = getState();
        const mapped = mapping[exerciseName];
        if (mapped) {
            switch (mapped.type) {
                case "create":
                    return mapped.category ?? "Other";
                case "existing":
                    return getExerciseDefCategory(mapped.exerciseDefId);
                case "skip":
                    return null;
                default:
                    return null;
            }
        }
        const knownId = knownMatches[exerciseName];
        if (knownId) {
            return getExerciseDefCategory(knownId);
        }
        return deps.inferExerciseCategory(exerciseName);
    };

    const getKnownLabel = (exerciseName: string): string => {
        const { mapping, knownMatches, exerciseDefs } = getState();
        const mapped = mapping[exerciseName];
        if (mapped && mapped.type !== "skip") {
            return getMappedLabel(exerciseName);
        }
        const knownId = knownMatches[exerciseName];
        if (knownId) {
            return exerciseDefs[knownId]?.name ?? exerciseName;
        }
        return exerciseName;
    };

    const getKnownCategory = (exerciseName: string): ExerciseCategory => {
        const { mapping, knownMatches } = getState();
        const mapped = mapping[exerciseName];
        if (mapped?.type === "create") {
            return mapped.category ?? "Other";
        }
        if (mapped?.type === "existing") {
            return getExerciseDefCategory(mapped.exerciseDefId) ?? "Other";
        }
        const knownId = knownMatches[exerciseName];
        if (knownId) {
            return getExerciseDefCategory(knownId) ?? "Other";
        }
        return "Other";
    };

    const isKnownExercise = (exerciseName: string): boolean => {
        const { knownMatches } = getState();
        return knownMatches[exerciseName] != null;
    };

    const getExerciseOptions = () => {
        const { exerciseDefs } = getState();
        return Object.entries(exerciseDefs)
            .map(([id, def]) => ({ id, name: def.name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    };

    const getSuggestions = () => {
        const { unknownExercises, exerciseDefs } = getState();
        const suggestionMap: Record<
            string,
            Array<{ id: string; name: string }>
        > = {};
        unknownExercises.forEach((name) => {
            const suggested = deps.suggestExerciseMatches(name, exerciseDefs);
            const inferred = deps.inferExerciseCategory(name);
            suggestionMap[name] = inferred
                ? suggested.filter(
                      (item) =>
                          exerciseDefs[item.id]?.category === inferred
                  )
                : suggested;
        });
        return suggestionMap;
    };

    const canImport = () => {
        const { importData, stage } = getState();
        return Boolean(importData) && stage === "mapping";
    };

    const isReady = () => {
        const { summary, stage } = getState();
        return summary != null && stage !== "idle";
    };

    return {
        loadCsv,
        openSelectModal,
        closeSelectModal,
        openCreateModal,
        closeCreateModal,
        setExerciseAsNew,
        setExerciseToExisting,
        skipExercise,
        runImport,
        getMappedLabel,
        getKnownLabel,
        isKnownExercise,
        getMappedCategory,
        getSuggestedCategory,
        getKnownCategory,
        getExerciseOptions,
        getSuggestions,
        canImport,
        isReady,
    };
};
