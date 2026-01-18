import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { useWorkoutTemplates, useDatabaseWriter } from "../../model/database";
import { WorkoutTemplate } from "../../model/types";
import { generateGuid } from "../../utils/util";
import { prefillExerciseFromHistory } from "../../utils/exercisePrefill";
import {
    getHealthLoggingEnabled,
    setHealthLoggingEnabled,
} from "../../model/health";
import {
    getStravaLoggingEnabled,
    setStravaLoggingEnabled,
    getAccessToken,
} from "../../model/strava";

export const usePlanViewModel = () => {
    const { templates, isLoading: isTemplatesLoading } = useWorkoutTemplates();
    const { saveActiveWorkout, createWorkoutTemplate } = useDatabaseWriter();

    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const [newWorkoutName, setNewWorkoutName] = useState("");
    const [isHealthLoggingEnabled, setHealthLoggingEnabledState] = useState(
        getHealthLoggingEnabled()
    );
    const [isStravaLoggingEnabled, setStravaLoggingEnabledState] = useState(
        getStravaLoggingEnabled()
    );
    const [isImportVisible, setImportVisible] = useState(false);
    const [importFileUri, setImportFileUri] = useState<string | null>(null);
    const [importFileName, setImportFileName] = useState<string | null>(null);

    const selectTemplate = async (workout: WorkoutTemplate) => {
        const baseExercises = workout.exercises.map((exercise) => ({
            ...exercise,
            id: generateGuid(),
            sets: exercise.sets.map((set) => ({
                ...set,
                id: generateGuid(),
            })),
        }));
        const exercises = await Promise.all(
            baseExercises.map((exercise) =>
                prefillExerciseFromHistory(exercise.exerciseId, exercise)
            )
        );
        await saveActiveWorkout({
            ...workout,
            id: generateGuid(),
            startTimestamp: Date.now(),
            exercises,
        });
    };

    const openCreateModal = () => setCreateModalVisible(true);

    const closeCreateModal = () => {
        setCreateModalVisible(false);
        setNewWorkoutName("");
    };

    const startBlankWorkout = async () => {
        await saveActiveWorkout({
            id: generateGuid(),
            name: "🏋️ Workout",
            exercises: [],
            notes: "",
            type: "strength",
            startTimestamp: Date.now(),
        });
    };

    const startRun = async () => {
        await saveActiveWorkout({
            id: generateGuid(),
            name: "💨 Run",
            exercises: [],
            notes: "",
            type: "run",
            startTimestamp: Date.now(),
            distance: 0,
        });
    };

    const createTemplate = async () => {
        const workoutName = newWorkoutName.trim() || "🏋️ Workout";
        await createWorkoutTemplate({
            id: generateGuid(),
            name: workoutName,
            exercises: [],
            notes: "",
            type: "strength",
        });
        closeCreateModal();
    };

    const toggleHealthLogging = () => {
        const next = !isHealthLoggingEnabled;
        setHealthLoggingEnabledState(next);
        setHealthLoggingEnabled(next);
        alert(`Apple Health logging ${next ? "enabled" : "disabled"}`);
    };

    const toggleStravaLogging = () => {
        const next = !isStravaLoggingEnabled;
        setStravaLoggingEnabledState(next);
        setStravaLoggingEnabled(next);
        alert(`Strava logging ${next ? "enabled" : "disabled"}`);
    };

    const authStrava = async () => {
        const token = await getAccessToken();
        alert(token ? "Strava auth successful" : "Strava auth failed");
    };

    const openImportFromStrong = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            type: "*/*",
        });

        if (result.canceled) {
            return;
        }

        const file = result.assets?.[0];
        if (!file?.uri) {
            return;
        }

        setImportFileUri(file.uri);
        setImportFileName(file.name ?? null);
        setImportVisible(true);
    };

    const closeImportFromStrong = () => {
        setImportVisible(false);
        setImportFileUri(null);
        setImportFileName(null);
    };

    return {
        templates,
        isTemplatesLoading,
        selectTemplate,
        startBlankWorkout,
        createTemplate,
        newWorkoutName,
        updateNewWorkoutName: setNewWorkoutName,
        isCreateModalVisible,
        openCreateModal,
        closeCreateModal,
        isHealthLoggingEnabled,
        isStravaLoggingEnabled,
        toggleHealthLogging,
        toggleStravaLogging,
        authStrava,
        startRun,
        isImportVisible,
        importFileUri,
        importFileName,
        openImportFromStrong,
        closeImportFromStrong,
    };
};
