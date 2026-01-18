import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { File as ExpoFile } from "expo-file-system";
import { useQueryClient } from "@tanstack/react-query";
import {
    STRONG_REQUIRED_COLUMNS,
    buildImportData,
    parseStrongCsv,
} from "../../model/import/importStrongCsv";
import {
    matchExerciseName,
    suggestExerciseMatches,
} from "../../model/import/import.helpers";
import { importWorkouts } from "../../model/import/importWorkouts";
import { QueryKey, fetchExerciseDefs } from "../../model/database";
import { inferExerciseCategory } from "./import.viewModel.helpers";
import {
    createImportViewModelCore,
    createInitialImportViewModelState,
} from "./import.viewModel.core";

export interface UseImportViewModelParams {
    fileUri: string | null;
    fileName: string | null;
    onClose: () => void;
}

export const useImportViewModel = ({
    fileUri,
    fileName,
    onClose,
}: UseImportViewModelParams) => {
    const queryClient = useQueryClient();
    const [state, setState] = useState(createInitialImportViewModelState());
    const stateRef = useRef(state);
    stateRef.current = state;

    const setStateWithSummary = useCallback(
        (updater: (prev: typeof state) => typeof state) => {
            setState((prev) => {
                const next = updater(prev);
                if (!next.summary) {
                    return next;
                }
                const newCount = next.unknownExercises.filter(
                    (name) => next.mapping[name]?.type !== "skip"
                ).length;
                const skippedCount = next.unknownExercises.filter(
                    (name) => next.mapping[name]?.type === "skip"
                ).length;
                return {
                    ...next,
                    summary: {
                        ...next.summary,
                        knownExercises: next.knownExercises.length,
                        unknownExercises: newCount,
                        skippedExercises: skippedCount,
                    },
                };
            });
        },
        []
    );

    const getState = useCallback(() => stateRef.current, []);

    const deps = useMemo(
        () => ({
            fetchExerciseDefs,
            readFileText: async (uri: string) => {
                const sourceFile = new ExpoFile(uri);
                return sourceFile.text();
            },
            requiredColumns: STRONG_REQUIRED_COLUMNS,
            parseStrongCsv,
            buildImportData,
            matchExerciseName,
            suggestExerciseMatches,
            importWorkouts,
            inferExerciseCategory,
            alert: Alert.alert,
            invalidateQueries: (queryKey: unknown[]) =>
                queryClient.invalidateQueries({ queryKey }),
            queryKeys: {
                completedWorkouts: [QueryKey.CompletedWorkouts],
                exerciseDefs: [QueryKey.ExerciseDefs],
            },
        }),
        [queryClient]
    );

    const core = useMemo(
        () =>
            createImportViewModelCore({
                getState,
                setState: setStateWithSummary,
                deps,
                onClose,
            }),
        [deps, getState, onClose, setStateWithSummary]
    );

    useEffect(() => {
        if (fileUri) {
            void core.loadCsv(fileUri);
        }
    }, [core, fileUri]);

    const suggestions = core.getSuggestions();
    const exerciseOptions = core.getExerciseOptions();
    const canImport = core.canImport();
    const isReady = core.isReady();

    return {
        stage: state.stage,
        fileName,
        summary: state.summary,
        importData: state.importData,
        unknownExercises: state.unknownExercises,
        knownExercises: state.knownExercises,
        suggestions,
        mapping: state.mapping,
        knownMatches: state.knownMatches,
        selectedExercise: state.selectedExercise,
        exerciseOptions,
        isSelectModalVisible: state.isSelectModalVisible,
        isCreateModalVisible: state.isCreateModalVisible,
        isReady,
        canImport,
        openSelectModal: core.openSelectModal,
        closeSelectModal: core.closeSelectModal,
        openCreateModal: core.openCreateModal,
        closeCreateModal: core.closeCreateModal,
        setExerciseAsNew: core.setExerciseAsNew,
        setExerciseToExisting: core.setExerciseToExisting,
        skipExercise: core.skipExercise,
        runImport: core.runImport,
        getMappedLabel: core.getMappedLabel,
        getKnownLabel: core.getKnownLabel,
        isKnownExercise: core.isKnownExercise,
        getMappedCategory: core.getMappedCategory,
        getSuggestedCategory: core.getSuggestedCategory,
        getKnownCategory: core.getKnownCategory,
    };
};
