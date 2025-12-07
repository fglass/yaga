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

    const startBlankWorkout = async () => {
        await saveActiveWorkout({
            id: generateGuid(),
            name: "New Workout",
            exercises: [],
            notes: "",
        });
    };

    const openCreateModal = () => setCreateModalVisible(true);

    const closeCreateModal = () => {
        setCreateModalVisible(false);
        setNewWorkoutName("");
    };

    const createTemplate = async () => {
        const workoutName = newWorkoutName.trim() || "New Workout";
        await createWorkoutTemplate({
            id: generateGuid(),
            name: workoutName,
            exercises: [],
            notes: "",
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
    };
};
