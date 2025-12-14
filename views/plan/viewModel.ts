import { useState } from "react";
import { useWorkouts, useDatabaseWriter } from "../../model/database";
import { Workout } from "../../model/types";
import { generateGuid } from "../../util";
import {
    getHealthLoggingEnabled,
    setHealthLoggingEnabled,
} from "../../model/health";

export const usePlanViewModel = () => {
    const workouts = useWorkouts();
    const { saveActiveWorkout, createWorkoutTemplate } = useDatabaseWriter();

    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const [newWorkoutName, setNewWorkoutName] = useState("");
    const [isHealthLoggingEnabled, setHealthLoggingEnabledState] = useState(
        getHealthLoggingEnabled()
    );

    const selectWorkout = async (workout: Workout) => {
        await saveActiveWorkout(workout);
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
        });
    };

    const startRun = async () => {
        await saveActiveWorkout({
            id: generateGuid(),
            name: "💨 Run",
            exercises: [],
            notes: "",
            type: "run",
            distanceKm: 0,
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

    return {
        workouts,
        selectWorkout,
        startBlankWorkout,
        createTemplate,
        newWorkoutName,
        updateNewWorkoutName: setNewWorkoutName,
        isCreateModalVisible,
        openCreateModal,
        closeCreateModal,
        isHealthLoggingEnabled,
        toggleHealthLogging,
        startRun,
    };
};
