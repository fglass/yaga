import { useState } from "react";
import { useWorkoutTemplates, useDatabaseWriter } from "../../model/database";
import { WorkoutTemplate } from "../../model/types";
import { generateGuid } from "../../utils/guid";
import { prefillExerciseFromHistory } from "../../utils/exercisePrefill";

export const usePlanViewModel = () => {
    const { templates, isLoading: isTemplatesLoading } = useWorkoutTemplates();
    const { saveActiveWorkout, createWorkoutTemplate } = useDatabaseWriter();

    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const [newWorkoutName, setNewWorkoutName] = useState("");

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
            metadata: {},
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
            name: "Workout",
            exercises: [],
            notes: "",
            type: "strength",
            metadata: {},
            startTimestamp: Date.now(),
        });
    };

    const startRun = async () => {
        await saveActiveWorkout({
            id: generateGuid(),
            name: "Treadmill",
            exercises: [],
            notes: "",
            type: "run",
            metadata: {},
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
        startRun,
    };
};
