import { useCallback, useEffect, useReducer, useState } from "react";
import { useQueryClient } from "react-query";
import { ExerciseDef, ModalType, Workout } from "../../model/types";
import { workoutProducer, ActionType } from "./producer";
import {
    Key,
    completeWorkout,
    createExerciseDef,
    saveActiveWorkout,
    useExerciseDefs,
} from "../../model/database";
import { withWarning } from "../../util";
import * as Haptics from "expo-haptics";

interface Props {
    initialWorkout: Workout;
    onEnd: () => Promise<void>;
}

interface ViewModel {
    isLoading: boolean;
    workout: Workout; // TODO: flatten?
    exerciseDefs: Record<string, ExerciseDef>;
    restTimerResetKey: number;
    activeModal: ModalType;
    setActiveModal: (modalType: ModalType) => void;
    isModalActive: (modalType: ModalType) => boolean;
    onChangeWorkoutNotes: (notes: string) => void;
    onChangeExerciseNotes: (
        exerciseIdx: number,
        noteIdx: number,
        notes: string
    ) => void;
    onChangeWeight: (
        exerciseIdx: number,
        setIdx: number,
        weight: string
    ) => void;
    onChangeRep: (exerciseIdx: number, setIdx: number, reps: string) => void;
    onFinishSet: (
        exerciseIdx: number,
        setIdx: number,
        isFinished: boolean
    ) => void;
    onRemoveSet: (exerciseIdx: number, setIdx: number) => void;
    onRemoveExerciseNote: (exerciseIdx: number, noteIdx: number) => void;
    onAddSet: (exerciseIdx: number) => void;
    onAddExerciseNote: (exerciseIdx: number) => void;
    onAddExercise: (exerciseId: string) => void;
    onRemoveExercise: (exerciseIdx: number) => void;
    onCreateExerciseDef: (name: string, category: string) => void;
    onFinishWorkout: () => void;
}

export const useWorkoutViewModel = (props: Props): ViewModel => {
    const queryClient = useQueryClient(); // TODO: move use?
    const exerciseDefs = useExerciseDefs(); // TODO: move up?
    const [workout, dispatch] = useReducer(
        workoutProducer,
        props.initialWorkout
    );
    const [restTimerResetKey, setRestTimerResetKey] = useState(0);
    const [activeModal, setActiveModal] = useState(ModalType.None);

    useEffect(() => {
        saveActiveWorkout(workout); // Fire-and-forget
    }, [workout]);

    const isLoading = Object.keys(exerciseDefs).length === 0;

    const isModalActive = (modalType: ModalType) =>
        (activeModal & modalType) === modalType;

    const resetRestTimer = () => {
        setRestTimerResetKey((prevKey: number) => prevKey + 1);
    };

    const onCreateExerciseDef = async (name: string, category: string) => {
        const exerciseId = await createExerciseDef(name, category);
        await queryClient.invalidateQueries(Key.ExerciseDefs);
        onAddExercise(exerciseId);
        setActiveModal(ModalType.None);
    };

    const onFinishWorkout = async () => {
        await completeWorkout(workout);
        await props.onEnd();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const onChangeWorkoutNotes = useCallback(
        (notes: string) =>
            dispatch({ type: ActionType.ChangeWorkoutNotes, notes }),
        []
    );

    const onChangeExerciseNotes = useCallback(
        (exerciseIdx: number, noteIdx: number, notes: string) =>
            dispatch({
                type: ActionType.ChangeExerciseNote,
                exerciseIdx,
                noteIdx,
                notes,
            }),
        []
    );

    const onChangeWeight = useCallback(
        (exerciseIdx: number, setIdx: number, weight: string) =>
            dispatch({
                type: ActionType.ChangeWeight,
                exerciseIdx,
                setIdx,
                weight,
            }),
        []
    );

    const onChangeRep = useCallback(
        (exerciseIdx: number, setIdx: number, reps: string) =>
            dispatch({
                type: ActionType.ChangeReps,
                exerciseIdx,
                setIdx,
                reps,
            }),
        []
    );

    const onFinishSet = useCallback(
        (exerciseIdx: number, setIdx: number, isFinished: boolean) => {
            dispatch({
                type: ActionType.FinishSet,
                exerciseIdx,
                setIdx,
                isFinished,
            });
            if (isFinished) {
                resetRestTimer();
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        []
    );

    const onRemoveSet = useCallback((exerciseIdx: number, setIdx: number) => {
        dispatch({ type: ActionType.RemoveSet, exerciseIdx, setIdx });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const onRemoveExerciseNote = useCallback(
        (exerciseIdx: number, noteIdx: number) => {
            dispatch({
                type: ActionType.RemoveExerciseNote,
                exerciseIdx,
                noteIdx,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        []
    );

    const onAddSet = useCallback((exerciseIdx: number) => {
        dispatch({ type: ActionType.AddSet, exerciseIdx });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const onAddExerciseNote = useCallback((exerciseIdx: number) => {
        dispatch({ type: ActionType.AddExerciseNote, exerciseIdx });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const onAddExercise = useCallback((exerciseId: string) => {
        dispatch({ type: ActionType.AddExercise, exerciseId });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const onRemoveExercise = useCallback((exerciseIdx: number) => {
        withWarning(() => {
            dispatch({
                type: ActionType.RemoveExercise,
                exerciseIdx,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
    }, []);

    return {
        isLoading,
        workout,
        exerciseDefs,
        restTimerResetKey,
        activeModal,
        setActiveModal,
        isModalActive,
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
