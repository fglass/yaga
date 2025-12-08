import { useCallback, useEffect, useReducer, useState } from "react";
import { Exercise, ExerciseDef, ModalType, Workout } from "../../model/types";
import { workoutProducer, ActionType } from "./reducer";
import {
    saveActiveWorkout,
    useDatabaseWriter,
    useExerciseDefs,
} from "../../model/database";
import { generateGuid, withWarning } from "../../util";
import * as Haptics from "expo-haptics";
import { useTimers } from "./hooks";
import { logAppleHealthWorkout } from "../../model/health";

interface Props {
    initialWorkout: Workout;
    onFinish: () => Promise<void>;
    onCancel: () => Promise<void>;
}

interface ViewModel {
    isLoading: boolean;
    workout: Workout; // TODO: flatten?
    workoutDurationS: number;
    remainingRestTimeS: number;
    totalRestDurationS: number;
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
    onDecrementRep: (exerciseIdx: number, setIdx: number) => void;
    onFinishSet: (
        exerciseIdx: number,
        setIdx: number,
        isFinished: boolean
    ) => void;
    onRemoveSet: (exerciseIdx: number, setIdx: number) => void;
    onAddSet: (exerciseIdx: number) => void;
    copyToCurrentSet: (exerciseIdx: number, setIdx: number) => void;
    onRemoveExerciseNote: (exerciseIdx: number, noteIdx: number) => void;
    onAddExerciseNote: (exerciseIdx: number) => void;
    isNotesExpanded: (exercise: Exercise) => boolean;
    onNoteButtonPress: (exercise: Exercise, exerciseIdx: number) => void;
    onAddExercise: (exerciseId: string) => void;
    onRemoveExercise: (exerciseIdx: number) => void;
    onMoveExercise: (exerciseIdx: number, delta: number) => void;
    onCreateExerciseDef: (name: string, category: string) => void;
    onFinishWorkout: () => Promise<void>;
    onCancelWorkout: () => Promise<void>;
    onAdjustRestTimer: (deltaS: number) => void;
    onRestFinish: () => void;
    calculateSetDuration: (
        setIdx: number,
        exerciseIdx: number
    ) => string | null;
}

const CALORIES_PER_HOUR = 350;

export const useWorkoutViewModel = (props: Props): ViewModel => {
    const [workout, dispatch] = useReducer(
        workoutProducer,
        props.initialWorkout
    );

    const exerciseDefs = useExerciseDefs(); // TODO: lift up?
    const {
        workoutStartTime,
        workoutDurationS,
        remainingRestTimeS,
        totalRestDurationS,
        adjustRestTimer,
        resetRestTimer,
    } = useTimers();

    const { completeWorkout, createExerciseDef } = useDatabaseWriter();
    const [activeModal, setActiveModal] = useState(ModalType.None);
    const [expandedNotes, setExpandedNotes] = useState<
        Record<string, boolean | undefined>
    >({});

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
        const finishDate = new Date();
        const completedWorkout = {
            ...workout,
            id: generateGuid(),
            endTimestamp: finishDate.getTime(),
            duration: workoutDurationS,
        };

        await completeWorkout(completedWorkout);

        const durationHours = Math.max(0, workoutDurationS / 3600);
        const calories = durationHours * CALORIES_PER_HOUR;
        await logAppleHealthWorkout({
            startDate: new Date(workoutStartTime),
            endDate: finishDate,
            calories,
        });

        await props.onFinish();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const onCancelWorkout = async () => {
        withWarning(async () => {
            await props.onCancel();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        });
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

    const onDecrementRep = useCallback(
        (exerciseIdx: number, setIdx: number) => {
            dispatch({
                type: ActionType.DecrementReps,
                exerciseIdx,
                setIdx,
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
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

    const onAddSet = useCallback((exerciseIdx: number) => {
        dispatch({ type: ActionType.AddSet, exerciseIdx });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const copyToCurrentSet = useCallback(
        (exerciseIdx: number, setIdx: number) => {
            dispatch({
                type: ActionType.CopyToCurrentSet,
                exerciseIdx,
                setIdx,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        []
    );

    const onRemoveExerciseNote = useCallback(
        (exerciseIdx: number, noteIdx: number) => {
            dispatch({
                type: ActionType.RemoveExerciseNote,
                exerciseIdx,
                noteIdx,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setExpandedNotes((prev) => {
                const next = { ...prev };
                delete next[workout.exercises[exerciseIdx].id];
                return next;
            });
        },
        [workout.exercises]
    );

    const onAddExerciseNote = useCallback((exerciseIdx: number) => {
        dispatch({ type: ActionType.AddExerciseNote, exerciseIdx });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const isNotesExpanded = (exercise: Exercise) => {
        const stored = expandedNotes[exercise.id];
        if (stored !== undefined) {
            return stored;
        }
        return exercise.notes.length > 0;
    };

    const onNoteButtonPress = (exercise: Exercise, exerciseIdx: number) => {
        if (exercise.notes.length === 0) {
            onAddExerciseNote(exerciseIdx);
            setExpandedNotes((prev) => ({
                ...prev,
                [exercise.id]: true,
            }));
        } else {
            setExpandedNotes((prev) => ({
                ...prev,
                [exercise.id]: !isNotesExpanded(exercise),
            }));
        }
    };

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

    const onMoveExercise = useCallback((exerciseIdx: number, delta: number) => {
        dispatch({ type: ActionType.MoveExercise, exerciseIdx, delta });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const onAdjustRestTimer = useCallback((deltaS: number) => {
        adjustRestTimer(deltaS);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const onRestFinish = () => {
        alert("Rest finished!");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const calculateSetDuration = (setIdx: number, exerciseIdx: number) => {
        const exercise = workout.exercises[exerciseIdx];
        const set = exercise.sets[setIdx];

        if (set.finishTime === undefined) {
            return null;
        }

        let prevFinishTime = null;

        if (setIdx > 0) {
            prevFinishTime = exercise.sets[setIdx - 1].finishTime;
        } else if (exerciseIdx > 0) {
            const prevExercise = workout.exercises[exerciseIdx - 1];
            prevFinishTime =
                prevExercise.sets[prevExercise.sets.length - 1].finishTime;
        } else {
            prevFinishTime = workoutStartTime;
        }

        if (prevFinishTime == null) {
            return null;
        }

        const totalSeconds = Math.ceil(
            (set.finishTime - prevFinishTime) / 1000
        );

        if (totalSeconds <= 0) {
            return "-";
        }

        const nMins = Math.floor(totalSeconds / 60);
        const nSeconds = totalSeconds % 60;
        return `${nMins}m${nSeconds.toString().padStart(2, "0")}s`;
    };

    return {
        isLoading,
        workout,
        workoutDurationS,
        remainingRestTimeS,
        totalRestDurationS,
        exerciseDefs,
        activeModal,
        setActiveModal,
        isModalActive,
        onChangeWorkoutNotes,
        onChangeExerciseNotes,
        onChangeWeight,
        onChangeRep,
        onDecrementRep,
        onFinishSet,
        onRemoveSet,
        onAddSet,
        copyToCurrentSet,
        onRemoveExerciseNote,
        onAddExerciseNote,
        isNotesExpanded,
        onNoteButtonPress,
        onAddExercise,
        onRemoveExercise,
        onMoveExercise,
        onCreateExerciseDef,
        onFinishWorkout,
        onCancelWorkout,
        onAdjustRestTimer,
        onRestFinish,
        calculateSetDuration,
    };
};
