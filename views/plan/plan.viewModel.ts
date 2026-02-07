import { useWorkoutTemplates, useDatabaseWriter } from "../../model/database";
import { Workout, WorkoutTemplate } from "../../model/types";
import { generateGuid } from "../../utils/guid";
import { prefillExerciseFromHistory } from "../../utils/exercisePrefill";

type Params = {
    onCreateTemplate: (workout: Workout) => void;
};

export const usePlanViewModel = ({ onCreateTemplate }: Params) => {
    const { templates, isLoading: isTemplatesLoading } = useWorkoutTemplates();
    const { saveActiveWorkout } = useDatabaseWriter();

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

    const createTemplate = () => {
        onCreateTemplate({
            id: generateGuid(),
            name: "Workout",
            exercises: [],
            notes: "",
            type: "strength",
            metadata: {},
            startTimestamp: 0,
        });
    };

    return {
        templates,
        isTemplatesLoading,
        selectTemplate,
        startBlankWorkout,
        createTemplate,
        startRun,
    };
};
