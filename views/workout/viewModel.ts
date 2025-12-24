import { Alert } from "react-native";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Exercise, ExerciseDef, ModalType, Workout } from "../../model/types";
import { workoutProducer, ActionType } from "./reducer";
import {
    saveActiveWorkout,
    useDatabaseWriter,
    useExerciseDefs,
} from "../../model/database";
import {
    ensureNotificationPermission,
    generateGuid,
    withWarning,
} from "../../utils/util";
import { prefillExerciseFromHistory } from "../../utils/exercisePrefill";
import * as Haptics from "expo-haptics";
import { useTimers } from "./hooks";
import { logAppleHealthWorkout } from "../../model/health";
import * as Notifications from "expo-notifications";

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
    historyExerciseId: string | null;
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
    onAddExercise: (exerciseId: string) => Promise<void>;
    onRemoveExercise: (exerciseIdx: number) => void;
    onMoveExercise: (exerciseIdx: number, delta: number) => void;
    onCreateExerciseDef: (name: string, category: string) => void;
    onFinishWorkout: () => Promise<void>;
    onCancelWorkout: () => Promise<void>;
    onAdjustRestTimer: (deltaS: number) => void;
    calculateSetDuration: (
        setIdx: number,
        exerciseIdx: number
    ) => string | null;
    onShowExerciseHistory: (exerciseId: string) => void;
    onCloseExerciseHistory: () => void;
}

const CALORIES_PER_HOUR = 300;

export const useWorkoutViewModel = (props: Props): ViewModel => {
    const [workout, dispatch] = useReducer(workoutProducer, {
        ...props.initialWorkout,
    });

    const exerciseDefs = useExerciseDefs(); // TODO: lift up?
    const { completeWorkout, createExerciseDef } = useDatabaseWriter();
    const [activeModal, setActiveModal] = useState(ModalType.None);
    const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(
        null
    );
    const [expandedNotes, setExpandedNotes] = useState<
        Record<string, boolean | undefined>
    >({});

    const restNotificationIdRef = useRef<string | null>(null);
    const {
        workoutStartTime,
        workoutDurationS,
        remainingRestTimeS,
        totalRestDurationS,
        adjustRestTimer,
        resetRestTimer,
        cancelRestTimer,
    } = useTimers({
        onRestStart: (restEndTimeMs) =>
            scheduleRestFinishNotification(restEndTimeMs),
        onRestCancel: () => cancelRestFinishNotification(),
        initialStartTimeMs: workout.startTimestamp,
    });

    const cancelRestFinishNotification = useCallback(async () => {
        if (restNotificationIdRef.current == null) {
            return;
        }

        await Notifications.cancelScheduledNotificationAsync(
            restNotificationIdRef.current
        );
        restNotificationIdRef.current = null;
    }, []);

    const scheduleRestFinishNotification = useCallback(
        async (endTimeMs: number) => {
            const hasPermission = await ensureNotificationPermission();
            if (!hasPermission) {
                return;
            }

            await cancelRestFinishNotification();

            restNotificationIdRef.current =
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "🕛 Rest Finished",
                        sound: true,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: new Date(endTimeMs),
                    },
                });
        },
        [cancelRestFinishNotification]
    );

    useEffect(() => {
        // Executed when app is in foreground
        const onNotification = (notification: Notifications.Notification) => {
            const { title } = notification.request.content;
            Alert.alert(title || "Notification received");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        };

        const subscription =
            Notifications.addNotificationReceivedListener(onNotification);

        return () => subscription.remove();
    }, []);

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
        withWarning(
            async () => {
                const finishDate = new Date();
                const completedWorkout = {
                    ...workout,
                    id: generateGuid(),
                    endTimestamp: finishDate.getTime(),
                };

                await completeWorkout(completedWorkout);

                const durationHours = Math.max(0, workoutDurationS / 3600);
                const calories = durationHours * CALORIES_PER_HOUR;
                await logAppleHealthWorkout({
                    startDate: new Date(workoutStartTime),
                    endDate: finishDate,
                    calories,
                    workoutType: "strength",
                });

                cancelRestTimer();
                await props.onFinish();
                Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                );
            },
            "Finish Workout",
            "Are you sure?"
        );
    };

    const onCancelWorkout = async () => {
        withWarning(
            async () => {
                cancelRestTimer();
                await props.onCancel();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
            "Cancel Workout",
            "Are you sure?"
        );
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

    const onAddExercise = useCallback(async (exerciseId: string) => {
        const exercise = await prefillExerciseFromHistory(exerciseId, {
            id: generateGuid(),
            exerciseId,
            notes: [],
            sets: [
                {
                    id: generateGuid(),
                    weight: "0",
                    reps: "1",
                    finishTime: undefined,
                },
            ],
        });
        dispatch({ type: ActionType.AddExercise, exerciseId, exercise });
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

    const onShowExerciseHistory = useCallback((exerciseId: string) => {
        setActiveModal(ModalType.ExerciseHistory);
        setHistoryExerciseId(exerciseId);
    }, []);

    const onCloseExerciseHistory = useCallback(() => {
        setActiveModal(ModalType.None);
        setHistoryExerciseId(null);
    }, []);

    return {
        isLoading,
        workout,
        workoutDurationS,
        remainingRestTimeS,
        totalRestDurationS,
        exerciseDefs,
        historyExerciseId,
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
        calculateSetDuration,
        onShowExerciseHistory,
        onCloseExerciseHistory,
    };
};
