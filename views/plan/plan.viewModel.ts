import {
    useWorkoutTemplates,
    useDatabaseWriter,
    useActiveWorkout,
} from "../../model/database";
import * as Haptics from "expo-haptics";
import { ActionSheetIOS } from "react-native";
import { Workout, WorkoutTemplate } from "../../model/types";
import { generateGuid } from "../../utils/guid";
import { prefillExerciseFromHistory } from "../../utils/exercisePrefill";
import { withWarning } from "../../utils/util";

type Params = {
    onCreateTemplate: (workout: Workout) => void;
    onStartWorkout: (workout: Workout) => void;
    onStartRun: () => void;
};

export const usePlanViewModel = ({
    onCreateTemplate,
    onStartWorkout,
    onStartRun,
}: Params) => {
    const { templates, isLoading: isTemplatesLoading } = useWorkoutTemplates();
    const { activeWorkout, isMinimized } = useActiveWorkout();
    const { saveActiveWorkout, deleteWorkoutTemplate } = useDatabaseWriter();

    const startTemplateWorkout = async (workout: WorkoutTemplate) => {
        const startTimestamp = Date.now();
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
                prefillExerciseFromHistory(exercise.exerciseId, exercise, {
                    matchHistorySetCount: false,
                })
            )
        );

        const nextWorkout: Workout = {
            ...workout,
            id: generateGuid(),
            startTimestamp,
            exercises,
            metadata: {},
        };

        await saveActiveWorkout(nextWorkout);

        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        onStartWorkout(nextWorkout);
    };

    const selectTemplate = async (workout: WorkoutTemplate) => {
        const shouldWarn = isMinimized && activeWorkout != null;

        if (!shouldWarn) {
            await startTemplateWorkout(workout);
            return;
        }

        withWarning(
            () => {
                void startTemplateWorkout(workout);
            },
            {
                title: "⚠️ Overwrite Workout",
                message: "You have a workout in progress",
            }
        );
    };

    const startBlankWorkout = async () => {
        const workout: Workout = {
            id: generateGuid(),
            name: "Workout",
            exercises: [],
            notes: "",
            type: "strength",
            metadata: {},
            startTimestamp: Date.now(),
        };
        await saveActiveWorkout(workout);
        onStartWorkout(workout);
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
        onStartRun();
    };

    const createTemplate = () => {
        onCreateTemplate({
            id: generateGuid(),
            name: "Template",
            exercises: [],
            notes: "",
            type: "strength",
            metadata: {},
            startTimestamp: 0,
        });
    };

    const editTemplate = (template: WorkoutTemplate) => {
        onCreateTemplate({
            id: template.id,
            name: template.name,
            exercises: template.exercises,
            notes: template.notes,
            type: template.type,
            metadata: {},
            startTimestamp: 0,
        });
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const onTemplateActions = (template: WorkoutTemplate) => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ["Cancel", "Edit Template"],
                cancelButtonIndex: 0,
            },
            (selectedIndex) => {
                if (selectedIndex === 1) {
                    editTemplate(template);
                }
            }
        );
    };

    const onDeleteTemplate = (templateId: string) => {
        withWarning(
            () => {
                void deleteWorkoutTemplate(templateId);
                void Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                );
            },
            { title: "Delete Template", message: "Are you sure?" }
        );
    };

    return {
        templates,
        isTemplatesLoading,
        selectTemplate,
        startBlankWorkout,
        createTemplate,
        onTemplateActions,
        onDeleteTemplate,
        startRun,
    };
};
