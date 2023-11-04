import { useCallback, useEffect, useReducer, useState } from "react";
import { ExerciseDef, ModalType, Workout } from "../../model/types";
import { workoutProducer, ActionType } from "./reducer";
import {
    saveActiveWorkout,
    useDatabaseWriter,
    useExerciseDefs,
} from "../../model/database";
import { generateGuid, withWarning } from "../../util";
import * as Haptics from "expo-haptics";
import { useTimers } from "./hooks";

interface Props {
    initialWorkout: Workout;
    onEnd: () => Promise<void>;
}

interface ViewModel {
    isLoading: boolean;
    workout: Workout; // TODO: flatten?
    workoutDurationS: number;
    remainingRestTimeS: number;
    exerciseDefs: Record<string, ExerciseDef>;
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
    onCancelWorkout: () => void;
    onRestFinish: () => void;
}

export const useWorkoutViewModel = (props: Props): ViewModel => {
    const [workout, dispatch] = useReducer(
        workoutProducer,
        props.initialWorkout
    );

    const exerciseDefs = useExerciseDefs(); // TODO: lift up?
    const { workoutDurationS, remainingRestTimeS, resetRestTimer } =
        useTimers();

    const { completeWorkout, createExerciseDef } = useDatabaseWriter();
    const [activeModal, setActiveModal] = useState(ModalType.None);

    useEffect(() => {
        saveActiveWorkout(workout); // Fire-and-forget
    }, [workout]);

    const isLoading = Object.keys(exerciseDefs).length === 0;

    const isModalActive = (modalType: ModalType) =>
        (activeModal & modalType) === modalType;

    const onCreateExerciseDef = async (name: string, category: string) => {
        const exerciseId = await createExerciseDef({ name, category });
        onAddExercise(exerciseId);
        setActiveModal(ModalType.None);
    };

    const onFinishWorkout = async () => {
        const completedWorkout = {
            ...workout,
            id: generateGuid(),
            date: new Date().toLocaleString(),
            duration: workoutDurationS,
        };

        await completeWorkout(completedWorkout);
        await props.onEnd();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const onCancelWorkout = async () => {
        await props.onEnd();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    /* Workout change handlers */

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
        [resetRestTimer]
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

    const onRestFinish = () => {
        alert("Rest finished!");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    return {
        isLoading,
        workout,
        workoutDurationS,
        remainingRestTimeS,
        exerciseDefs,
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
        onCancelWorkout,
        onRestFinish,
    };
};
