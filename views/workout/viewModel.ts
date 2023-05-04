import { useCallback, useReducer, useState } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "react-query";
import { ExerciseDef, Workout } from "../../model/types";
import { workoutProducer, ActionType } from "./producer";
import {
    completeWorkout,
    createExerciseDef,
    useExerciseDefs,
} from "../../model/database";
import * as Haptics from "expo-haptics";

interface Props {
    workout: Workout;
    onEnd: () => void;
}

interface WorkoutViewModel {
    // TODO: remove `args`
    isLoading: boolean;
    workout: Workout;
    exerciseDefs: Record<string, ExerciseDef>;
    restTimerResetKey: number;
    exerciseListModalVisible: boolean;
    newExerciseModalVisible: boolean;
    setExerciseListModalVisible: (visible: boolean) => void;
    setNewExerciseModalVisible: (visible: boolean) => void;
    onChangeWorkoutNotes: (notes: string) => void;
    onChangeExerciseNotes: (args: {
        exerciseIdx: number;
        noteIdx: number;
        notes: string;
    }) => void;
    onChangeWeight: (args: {
        exerciseIdx: number;
        setIdx: number;
        weight: string;
    }) => void;
    onChangeRep: (args: {
        exerciseIdx: number;
        setIdx: number;
        reps: string;
    }) => void;
    onFinishSet: (args: {
        exerciseIdx: number;
        setIdx: number;
        isFinished: boolean;
    }) => void;
    onRemoveSet: (args: { exerciseIdx: number; setIdx: number }) => void;
    onRemoveExerciseNote: (args: {
        exerciseIdx: number;
        noteIdx: number;
    }) => void;
    onAddSet: (args: { exerciseIdx: number }) => void;
    onAddExerciseNote: (args: { exerciseIdx: number }) => void;
    onAddExercise: (args: { exerciseId: string }) => void;
    onRemoveExercise: (args: { exerciseIdx: number }) => void;
    onCreateExerciseDef: (name: string, category: string) => void;
    onFinishWorkout: () => void;
}

export const useWorkoutViewModel = (props: Props): WorkoutViewModel => {
    const queryClient = useQueryClient(); // TODO: remove use
    const exerciseDefs = useExerciseDefs();
    const [workout, dispatch] = useReducer(workoutProducer, props.workout);
    const [restTimerResetKey, setRestTimerResetKey] = useState(0);
    const [exerciseListModalVisible, setExerciseListModalVisible] =
        useState(false);
    const [newExerciseModalVisible, setNewExerciseModalVisible] =
        useState(false);

    const isLoading = Object.keys(exerciseDefs).length === 0;

    const resetRestTimer = () => {
        setRestTimerResetKey((prevKey: number) => prevKey + 1);
    };

    const onCreateExerciseDef = (name: string, category: string) => {
        setNewExerciseModalVisible(false);
        createExerciseDef(name, category).then((exerciseId) =>
            queryClient
                .invalidateQueries("exerciseDefs")
                .then(() => onAddExercise({ exerciseId }))
        );
    };

    const onFinishWorkout = () => {
        completeWorkout(workout).then(() => {
            props.onEnd();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
    };

    const onChangeWorkoutNotes = useCallback(
        (notes: string) =>
            dispatch({ type: ActionType.ChangeWorkoutNotes, notes }),
        []
    );

    const onChangeExerciseNotes = useCallback(
        (args: { exerciseIdx: number; noteIdx: number; notes: string }) =>
            dispatch({ type: ActionType.ChangeExerciseNote, ...args }),
        []
    );

    const onChangeWeight = useCallback(
        (args: { exerciseIdx: number; setIdx: number; weight: string }) =>
            dispatch({ type: ActionType.ChangeWeight, ...args }),
        []
    );

    const onChangeRep = useCallback(
        (args: { exerciseIdx: number; setIdx: number; reps: string }) =>
            dispatch({ type: ActionType.ChangeReps, ...args }),
        []
    );

    const onFinishSet = useCallback(
        (args: {
            exerciseIdx: number;
            setIdx: number;
            isFinished: boolean;
        }) => {
            dispatch({ type: ActionType.FinishSet, ...args });
            if (args.isFinished) {
                resetRestTimer();
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        []
    );

    const onRemoveSet = useCallback(
        (args: { exerciseIdx: number; setIdx: number }) => {
            dispatch({ type: ActionType.RemoveSet, ...args });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        []
    );

    const onRemoveExerciseNote = useCallback(
        (args: { exerciseIdx: number; noteIdx: number }) => {
            dispatch({ type: ActionType.RemoveExerciseNote, ...args });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        []
    );

    const onAddSet = useCallback((args: { exerciseIdx: number }) => {
        dispatch({ type: ActionType.AddSet, ...args });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const onAddExerciseNote = useCallback((args: { exerciseIdx: number }) => {
        dispatch({ type: ActionType.AddExerciseNote, ...args });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const onAddExercise = useCallback((args: { exerciseId: string }) => {
        dispatch({ type: ActionType.AddExercise, ...args });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const onRemoveExercise = useCallback((args: { exerciseIdx: number }) => {
        Alert.alert(
            "Warning",
            "This action cannot be undone",
            [
                {
                    text: "Confirm",
                    onPress: () => {
                        dispatch({ type: ActionType.RemoveExercise, ...args });
                        Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Success
                        );
                    },
                },
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ],
            { cancelable: false }
        );
    }, []);

    return {
        isLoading,
        workout,
        exerciseDefs,
        restTimerResetKey,
        exerciseListModalVisible,
        newExerciseModalVisible,
        setExerciseListModalVisible,
        setNewExerciseModalVisible,
        onChangeWorkoutNotes,
        onChangeExerciseNotes,
        onChangeWeight,
        onChangeRep,
        onFinishSet,
        onRemoveSet,
        onRemoveExerciseNote,
        onAddSet,
        onAddExerciseNote,
        onAddExercise,
        onRemoveExercise,
        onCreateExerciseDef,
        onFinishWorkout,
    };
};
