import { Alert } from "react-native";
import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from "react";
import {
    CompletedWorkout,
    Exercise,
    ExerciseCategory,
    ExerciseDef,
    ModalType,
    SET_TYPES,
    Workout,
    WorkoutTemplate,
} from "../../model/types";
import type { Set } from "../../model/types";
import { workoutProducer, ActionType } from "./workout.reducer";
import { createWorkoutViewModelCore } from "./workout.viewModel.core";
import {
    saveActiveWorkout,
    useDatabaseWriter,
    useExerciseDefs,
} from "../../model/database";
import { withWarning } from "../../utils/util";
import { ensureNotificationPermission } from "../../utils/notifications";
import { generateGuid } from "../../utils/guid";
import { prefillExerciseFromHistory } from "../../utils/exercisePrefill";
import * as Haptics from "expo-haptics";
import {
    useExerciseSetsFromCompletedWorkouts,
    useTimers,
} from "./workout.hooks";
import { logAppleHealthWorkout } from "../../model/health";
import * as Notifications from "expo-notifications";
import {
    findPreviousFinishedSetTime,
    getSetProgress as getSetProgressForSets,
    SetProgression,
} from "./workout.calculations";

type ActiveProps = {
    mode?: "active";
    initialWorkout: Workout;
    onFinish: () => Promise<void>;
    onCancel: () => Promise<void>;
};

type HistoryProps = {
    mode: "history";
    initialWorkout: CompletedWorkout;
    onFinish: () => void;
    onCancel: () => void;
};

type CreateProps = {
    mode: "create";
    initialWorkout: Workout;
    onFinish: () => void;
    onCancel: () => void;
};

type Props = ActiveProps | HistoryProps | CreateProps;

interface ViewModel {
    isLoading: boolean;
    workout: Workout; // TODO: flatten?
    startDateLabel: string;
    workoutDurationS: number;
    remainingRestTimeS: number;
    totalRestDurationS: number;
    exerciseDefs: Record<string, ExerciseDef>;
    historyExerciseId: string | null;
    activeModal: ModalType;
    isHistoryMode: boolean;
    isCreateMode: boolean;
    canSaveWorkout: boolean;
    onChangeWorkoutName: (name: string) => void;
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
    onCycleSetType: (exerciseIdx: number, setIdx: number) => void;
    onAdjustWeight: (
        exerciseIdx: number,
        setIdx: number,
        delta: number
    ) => void;
    onAdjustReps: (exerciseIdx: number, setIdx: number, delta: number) => void;
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
    onCreateExerciseDef: (
        name: string,
        category: ExerciseCategory
    ) => Promise<void>;
    onUpdateExerciseDef: (
        exerciseId: string,
        def: ExerciseDef
    ) => Promise<void>;
    onDeleteExerciseDef: (exerciseDefId: string) => Promise<string>;
    onMergeExerciseDefs: (
        targetExerciseDefId: string,
        sourceExerciseDefIds: string[]
    ) => Promise<void>;
    onFinishWorkout: () => Promise<void>;
    onCancelWorkout: () => Promise<void>;
    onAdjustRestTimer: (deltaS: number) => void;
    calculateSetDuration: (
        setIdx: number,
        exerciseIdx: number
    ) => string | null;
    getSetProgress: (exerciseIdx: number, setIdx: number) => SetProgression;
    onShowExerciseHistory: (exerciseId: string) => void;
    onCloseExerciseHistory: () => void;
}

const CALORIES_PER_HOUR = 300;

export const useWorkoutViewModel = (props: Props): ViewModel => {
    const isCreateMode = props.mode === "create";
    const isHistoryMode = props.mode === "history";
    const isActiveMode = !isHistoryMode && !isCreateMode;

    const initialWorkout = { ...(props.initialWorkout as Workout) };
    const [workout, dispatch] = useReducer(workoutProducer, initialWorkout);
    const workoutRef = useRef(workout); // Keep latest workout for core updates (SyncWorkout).

    const exerciseDefs = useExerciseDefs();
    const {
        completeWorkout,
        createExerciseDef,
        createWorkoutTemplate,
        updateExerciseDef,
        deleteExerciseDef,
        mergeExerciseDefs,
    } = useDatabaseWriter();
    const [activeModal, setActiveModal] = useState(ModalType.None);
    const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(
        null
    );
    const [expandedNotes, setExpandedNotes] = useState<
        Record<string, boolean | undefined>
    >({});

    const restNotificationIdRef = useRef<string | null>(null);
    const restScheduleTokenRef = useRef(0);

    const noopPrefill = useCallback(
        async (_exerciseId: string, exercise: Exercise) => exercise,
        []
    );
    const prefillExercise = isCreateMode
        ? noopPrefill
        : prefillExerciseFromHistory;

    const workoutCore = useMemo(
        () =>
            createWorkoutViewModelCore({
                setState: (updater) => {
                    // Sync core-updated workout into reducer state
                    const next = updater({ workout: workoutRef.current });
                    if (next.workout !== workoutRef.current) {
                        workoutRef.current = next.workout;
                        dispatch({
                            type: ActionType.SyncWorkout,
                            workout: next.workout,
                        });
                    }
                },
                deps: {
                    generateGuid,
                    prefillExerciseFromHistory: prefillExercise,
                    updateExerciseDef,
                    deleteExerciseDef,
                    mergeExerciseDefs,
                },
            }),
        [
            deleteExerciseDef,
            mergeExerciseDefs,
            prefillExercise,
            updateExerciseDef,
        ]
    );

    const exerciseIds = useMemo(
        () => workout.exercises.map((exercise) => exercise.exerciseId),
        [workout.exercises]
    );

    const historyEndTimestamp =
        props.mode === "history"
            ? props.initialWorkout.endTimestamp
            : undefined;
    const { historySets } = useExerciseSetsFromCompletedWorkouts({
        exerciseIds,
        nWorkouts: 1,
        isEnabled: true,
        beforeTimestamp: isHistoryMode ? historyEndTimestamp : undefined,
    });
    const previousSetsByExerciseId = useMemo(() => {
        const next: Record<string, Set[]> = {};
        for (const [exerciseId, history] of Object.entries(historySets)) {
            const sets = history?.[0]?.sets;
            if (sets && sets.length > 0) {
                next[exerciseId] = sets;
            }
        }
        return next;
    }, [historySets]);

    const cancelScheduledRestNotification = useCallback(async () => {
        if (restNotificationIdRef.current == null) {
            return;
        }

        const notificationId = restNotificationIdRef.current;
        restNotificationIdRef.current = null;
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }, []);

    const cancelRestFinishNotification = useCallback(async () => {
        restScheduleTokenRef.current += 1;
        await cancelScheduledRestNotification();
    }, [cancelScheduledRestNotification]);

    const scheduleRestFinishNotification = useCallback(
        async (endTimeMs: number) => {
            const hasPermission = await ensureNotificationPermission();
            if (!hasPermission) {
                return;
            }

            const scheduleToken = restScheduleTokenRef.current + 1;
            restScheduleTokenRef.current = scheduleToken;
            await cancelScheduledRestNotification();

            const notificationId =
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

            // Cancel stale schedules that resolve after a newer rest update
            // E.g., on immediate timer adjust
            if (restScheduleTokenRef.current !== scheduleToken) {
                await Notifications.cancelScheduledNotificationAsync(
                    notificationId
                );
                return;
            }
            restNotificationIdRef.current = notificationId;
        },
        [cancelScheduledRestNotification]
    );

    const noop = useCallback(() => {}, []);
    const {
        workoutStartTime,
        workoutDurationS,
        remainingRestTimeS,
        totalRestDurationS,
        adjustRestTimer,
        resetRestTimer,
        cancelRestTimer,
    } = useTimers({
        onRestStart: isActiveMode ? scheduleRestFinishNotification : noop,
        onRestCancel: isActiveMode ? cancelRestFinishNotification : noop,
        initialStartTimeMs: workout.startTimestamp,
        isEnabled: isActiveMode,
    });

    useEffect(() => {
        workoutRef.current = workout;
    }, [workout]);

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
        if (!isActiveMode) {
            return;
        }
        saveActiveWorkout(workout); // Fire-and-forget
    }, [isActiveMode, workout]);

    const isLoading = Object.keys(exerciseDefs).length === 0;

    const isModalActive = (modalType: ModalType) =>
        (activeModal & modalType) === modalType;

    const onCreateExerciseDef = async (
        name: string,
        category: ExerciseCategory
    ) => {
        const exerciseId = await createExerciseDef({ name, category });
        await workoutCore.onAddExercise(exerciseId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActiveModal(ModalType.ExerciseList);
    };

    const onFinishWorkout = async () => {
        if (isCreateMode) {
            const template: WorkoutTemplate = {
                id: workout.id,
                name: workout.name,
                exercises: workout.exercises,
                notes: workout.notes,
                type: workout.type,
            };
            await createWorkoutTemplate(template);

            props.onFinish();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
        }

        if (isHistoryMode) {
            const completedWorkout = {
                ...workout,
                endTimestamp: props.initialWorkout.endTimestamp,
            };

            await completeWorkout(completedWorkout as CompletedWorkout);

            cancelRestTimer();
            props.onFinish();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
        }

        withWarning(
            async () => {
                const finishDate = new Date();
                const completedWorkout = {
                    ...workout,
                    id: generateGuid(),
                    endTimestamp: finishDate.getTime(),
                };

                await completeWorkout(completedWorkout as CompletedWorkout);

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
            { title: "Finish Workout", message: "Are you sure?" }
        );
    };

    const onCancelWorkout = async () => {
        if (isCreateMode || isHistoryMode) {
            props.onCancel();
            return;
        }

        const hasFinishedSet = workout.exercises.some((exercise) =>
            exercise.sets.some((set) => set.finishTime !== undefined)
        );
        withWarning(
            async () => {
                cancelRestTimer();
                await props.onCancel();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            },
            {
                title: "Cancel Workout",
                message: "Are you sure?",
                enabled: !hasFinishedSet,
            }
        );
    };

    /* Workout change handlers */

    const onChangeWorkoutName = useCallback(
        (name: string) =>
            dispatch({ type: ActionType.ChangeWorkoutName, name }),
        []
    );

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

    const onCycleSetType = useCallback(
        (exerciseIdx: number, setIdx: number) => {
            const set = workout.exercises[exerciseIdx]?.sets[setIdx];
            if (!set) {
                return;
            }

            const currentTypeIdx = SET_TYPES.indexOf(set.type);
            const nextType =
                SET_TYPES[(currentTypeIdx + 1) % SET_TYPES.length] ??
                SET_TYPES[0];

            dispatch({
                type: ActionType.ChangeSetType,
                exerciseIdx,
                setIdx,
                setType: nextType,
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
        [workout.exercises]
    );

    const onAdjustWeight = useCallback(
        (exerciseIdx: number, setIdx: number, delta: number) => {
            const set = workout.exercises[exerciseIdx]?.sets[setIdx];
            if (!set) {
                return;
            }

            const currentWeight = parseFloat(set.weight);
            const baseWeight = isNaN(currentWeight) ? 0 : currentWeight;
            const nextWeight = Math.max(0, baseWeight + delta);

            if (nextWeight === baseWeight) {
                return;
            }

            const formattedWeight = Number(nextWeight.toFixed(2)).toString();
            dispatch({
                type: ActionType.ChangeWeight,
                exerciseIdx,
                setIdx,
                weight: formattedWeight,
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        [workout.exercises]
    );

    const onAdjustReps = useCallback(
        (exerciseIdx: number, setIdx: number, delta: number) => {
            const set = workout.exercises[exerciseIdx]?.sets[setIdx];
            if (!set) {
                return;
            }

            const currentReps = Number(set.reps);
            const baseReps = isNaN(currentReps) ? 0 : currentReps;
            const nextReps = Math.max(0, baseReps + delta);

            if (nextReps === baseReps) {
                return;
            }

            dispatch({
                type: ActionType.ChangeReps,
                exerciseIdx,
                setIdx,
                reps: `${nextReps}`,
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        [workout.exercises]
    );

    const onFinishSet = useCallback(
        (exerciseIdx: number, setIdx: number, isFinished: boolean) => {
            dispatch({
                type: ActionType.FinishSet,
                exerciseIdx,
                setIdx,
                isFinished,
            });
            if (isFinished && isActiveMode) {
                resetRestTimer();
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        [isActiveMode, resetRestTimer]
    );

    const onRemoveSet = useCallback(
        (exerciseIdx: number, setIdx: number) => {
            const set = workout.exercises[exerciseIdx]?.sets[setIdx];
            const shouldSkipWarning =
                set == null || set.finishTime === undefined;

            withWarning(
                () => {
                    dispatch({
                        type: ActionType.RemoveSet,
                        exerciseIdx,
                        setIdx,
                    });
                    Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success
                    );
                },
                {
                    title: "Remove Set",
                    message: "Are you sure?",
                    enabled: shouldSkipWarning,
                }
            );
        },
        [workout]
    );

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const onRemoveExercise = useCallback(
        (exerciseIdx: number) => {
            const hasFinishedSet =
                workout.exercises[exerciseIdx]?.sets.some(
                    (entry) => entry.finishTime !== undefined
                ) ?? false;
            const shouldSkipWarning = !hasFinishedSet;

            withWarning(
                () => {
                    dispatch({
                        type: ActionType.RemoveExercise,
                        exerciseIdx,
                    });
                    Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success
                    );
                },
                {
                    title: "Remove Exercise",
                    message: "Are you sure?",
                    enabled: shouldSkipWarning,
                }
            );
        },
        [workout.exercises]
    );

    const onMoveExercise = useCallback((exerciseIdx: number, delta: number) => {
        dispatch({ type: ActionType.MoveExercise, exerciseIdx, delta });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const onAdjustRestTimer = useCallback(
        (deltaS: number) => {
            if (!isActiveMode) {
                return;
            }
            adjustRestTimer(deltaS);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
        [adjustRestTimer, isActiveMode]
    );

    const calculateSetDuration = (setIdx: number, exerciseIdx: number) => {
        const exercise = workout.exercises[exerciseIdx];
        const set = exercise.sets[setIdx];

        if (set.finishTime === undefined) {
            return null;
        }

        const prevFinishTime =
            findPreviousFinishedSetTime(workout, exerciseIdx, setIdx) ??
            workoutStartTime;

        const totalSeconds = Math.ceil(
            (set.finishTime - prevFinishTime) / 1000
        );

        if (totalSeconds <= 0 || totalSeconds > 600) {
            return "-";
        }

        const nMins = Math.floor(totalSeconds / 60);
        const nSeconds = totalSeconds % 60;

        return `${nMins}m${nSeconds.toString().padStart(2, "0")}s`;
    };

    const getSetProgress = useCallback(
        (exerciseIdx: number, setIdx: number) => {
            const exercise = workout.exercises[exerciseIdx];
            if (!exercise) {
                return 0;
            }

            return getSetProgressForSets(
                previousSetsByExerciseId[exercise.exerciseId],
                exercise.sets,
                setIdx
            );
        },
        [previousSetsByExerciseId, workout.exercises]
    );

    const onShowExerciseHistory = useCallback((exerciseId: string) => {
        setActiveModal(ModalType.ExerciseHistory);
        setHistoryExerciseId(exerciseId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const onCloseExerciseHistory = useCallback(() => {
        setActiveModal(ModalType.None);
    }, []);

    const startDateLabel = useMemo(() => {
        const date = new Date(workout.startTimestamp);
        if (Number.isNaN(date.getTime())) {
            return "Unknown date";
        }

        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "2-digit",
            year: "numeric",
        });
    }, [workout.startTimestamp]);

    const canSaveWorkout =
        !isCreateMode ||
        (workout.name.trim().length > 0 && workout.exercises.length > 0);

    return {
        isLoading,
        workout,
        startDateLabel,
        workoutDurationS,
        remainingRestTimeS,
        totalRestDurationS,
        exerciseDefs,
        historyExerciseId,
        activeModal,
        isHistoryMode,
        isCreateMode,
        canSaveWorkout,
        onChangeWorkoutName,
        setActiveModal,
        isModalActive,
        onChangeWorkoutNotes,
        onChangeExerciseNotes,
        onChangeWeight,
        onChangeRep,
        onCycleSetType,
        onAdjustWeight,
        onAdjustReps,
        onFinishSet,
        onRemoveSet,
        onAddSet,
        copyToCurrentSet,
        onRemoveExerciseNote,
        onAddExerciseNote,
        isNotesExpanded,
        onNoteButtonPress,
        onAddExercise: async (exerciseId: string) => {
            await workoutCore.onAddExercise(exerciseId);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
        onRemoveExercise,
        onMoveExercise,
        onCreateExerciseDef,
        onUpdateExerciseDef: workoutCore.updateExerciseDef,
        onDeleteExerciseDef: workoutCore.deleteExerciseDef,
        onMergeExerciseDefs: async (
            targetExerciseDefId: string,
            sourceExerciseDefIds: string[]
        ) => {
            await workoutCore.mergeExerciseDefs(
                targetExerciseDefId,
                sourceExerciseDefIds
            );
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
        onFinishWorkout,
        onCancelWorkout,
        onAdjustRestTimer,
        calculateSetDuration,
        getSetProgress,
        onShowExerciseHistory,
        onCloseExerciseHistory,
    };
};
