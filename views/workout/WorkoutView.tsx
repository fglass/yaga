import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Keyboard,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ExerciseListModal from "./ExerciseListModal";
import ExerciseHistoryModal from "./exerciseHistory/ExerciseHistoryModal";
import AdjustableNumberInput from "./AdjustableNumberInput";
import BlurFadeBackdrop from "../../components/BlurFadeBackdrop";
import Button from "../../components/Button";
import CountdownTimer from "../../components/CountdownTimer";
import Deletable from "../../components/Deletable";
import {
    CompletedWorkout,
    Exercise,
    ModalType,
    Note,
    Set,
    Workout,
} from "../../model/types";
import { formatTime } from "../../utils/util";
import { useWorkoutViewModel } from "./workout.viewModel";
import { styles } from "./workout.styles";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
    UNKNOWN_EXERCISE_DEF_ID,
    useActiveWorkout,
} from "../../model/database";

type ActiveProps = {
    mode: "active";
    initialWorkout: Workout;
    onFinish: () => Promise<void>;
    onCancel: () => Promise<void>;
    onMinimize: () => Promise<void>;
};

type TemplateProps = {
    mode: "template";
    initialWorkout: Workout;
    onFinish: () => void;
    onCancel: () => void;
};

type HistoryProps = {
    mode: "history";
    initialWorkout: CompletedWorkout;
    onFinish: () => void;
    onCancel: () => void;
};

type Props = ActiveProps | TemplateProps | HistoryProps;

const MINIMIZE_DISTANCE_PX = 36;
const MINIMIZE_VELOCITY_PX = 240;
const MINI_BAR_HEIGHT_PX = 42;
const MINI_BAR_GAP_PX = 8;
const HISTORY_MINI_BAR_CLEARANCE_PX = 12;
const STATUS_BAR_BLUR_EXTENSION_PX = 6;
const STATUS_BAR_BLUR_FADE_START_OFFSET_PX = 20;

const WorkoutView = (props: Props) => {
    const vm = useWorkoutViewModel(props);
    const isActiveMode = props.mode === "active";
    const { activeWorkout, isMinimized } = useActiveWorkout();

    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isLastExerciseInputFocused, setIsLastExerciseInputFocused] =
        useState(false);
    const [shakeErrors, setShakeErrors] = useState<Record<string, number>>({});

    const isMinimizeInFlight = useRef(false);
    const minimizeHandler = isActiveMode ? props.onMinimize : null;
    const persistActiveWorkout = vm.persistActiveWorkout;

    const shakeEmpty = (
        exerciseIdx: number,
        setIdx: number,
        fields: string[]
    ) => {
        setShakeErrors((prev) => {
            const next = { ...prev };
            for (const field of fields) {
                const key = `${exerciseIdx}-${setIdx}-${field}`;
                next[key] = (prev[key] ?? 0) + 1;
            }
            return next;
        });
    };

    // Handle keyboard displaying on last exercise input
    useEffect(() => {
        const onShow = (e: { endCoordinates: { height: number } }) => {
            setKeyboardHeight(e?.endCoordinates?.height ?? 0);
        };
        const onHide = () => {
            setKeyboardHeight(0);
            setIsLastExerciseInputFocused(false);
        };

        const showSub = Keyboard.addListener("keyboardDidShow", onShow);
        const hideSub = Keyboard.addListener("keyboardDidHide", onHide);

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const scrollToBottom = () => {
        // Delay to allow layout updates after keyboard shows
        setTimeout(() => {
            requestAnimationFrame(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            });
        }, 0);
    };

    const isRestTimerVisible =
        !vm.isHistoryMode && !vm.isTemplateMode && vm.remainingRestTimeS >= 0;
    const showSetCompletionColumns = !vm.isTemplateMode;

    const contentBottomPadding = useMemo(() => {
        if (isLastExerciseInputFocused) {
            return 16 + keyboardHeight;
        }

        const baseBottom = Math.max(16, insets.bottom);
        const minibarPadding =
            vm.isHistoryMode && isMinimized && activeWorkout != null
                ? insets.bottom +
                  MINI_BAR_GAP_PX +
                  MINI_BAR_HEIGHT_PX +
                  HISTORY_MINI_BAR_CLEARANCE_PX
                : 0;
        const bottom = Math.max(baseBottom, minibarPadding);

        return isRestTimerVisible ? 48 + bottom : bottom;
    }, [
        activeWorkout,
        isLastExerciseInputFocused,
        keyboardHeight,
        isMinimized,
        isRestTimerVisible,
        insets.bottom,
        vm.isHistoryMode,
    ]);
    const contentTopPadding = insets.top;

    const onMinimizeFromSwipe = useCallback(async () => {
        if (!minimizeHandler || isMinimizeInFlight.current) {
            return;
        }
        isMinimizeInFlight.current = true;
        try {
            await persistActiveWorkout().catch((error) => {
                console.error(error);
            });
            await minimizeHandler();
        } finally {
            isMinimizeInFlight.current = false;
        }
    }, [minimizeHandler, persistActiveWorkout]);

    const scrollNativeGesture = useMemo(() => Gesture.Native(), []);

    const minimizeGesture = useMemo(() => {
        return Gesture.Pan()
            .activeOffsetY(12)
            .simultaneousWithExternalGesture(scrollNativeGesture)
            .runOnJS(true)
            .onEnd((event) => {
                if (
                    event.translationY >= MINIMIZE_DISTANCE_PX &&
                    event.velocityY >= MINIMIZE_VELOCITY_PX
                ) {
                    void onMinimizeFromSwipe();
                }
            });
    }, [onMinimizeFromSwipe, scrollNativeGesture]);

    const renderHeader = () => {
        let subtitle: string | null = null;
        if (!vm.isTemplateMode) {
            subtitle = vm.isHistoryMode
                ? vm.startDateLabel
                : formatTime(vm.workoutDurationS);
        }

        return (
            <View style={[styles.card, styles.headerCard]}>
                {isActiveMode ? (
                    <GestureDetector gesture={minimizeGesture}>
                        <View style={styles.minimizeAffordance}>
                            <View style={styles.minimizeHandle} />
                        </View>
                    </GestureDetector>
                ) : null}
                <View style={styles.headerText}>
                    {vm.isTemplateMode ? (
                        <TextInput
                            style={styles.templateTitleInput}
                            value={vm.workout.name}
                            onChangeText={vm.onChangeWorkoutName}
                            placeholder="Template"
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        />
                    ) : isActiveMode && vm.canOpenTemplateHistory ? (
                        <TouchableOpacity
                            activeOpacity={0.75}
                            disabled={vm.isOpeningTemplateHistory}
                            onPress={() => {
                                void vm.onOpenTemplateHistory();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Open history filtered to this template"
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 8,
                                    opacity: vm.isOpeningTemplateHistory
                                        ? 0.75
                                        : 1,
                                }}
                            >
                                <Text style={styles.title}>
                                    {vm.workout.name}
                                </Text>
                                {vm.isOpeningTemplateHistory ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="white"
                                    />
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.title}>{vm.workout.name}</Text>
                    )}
                    {subtitle !== null && (
                        <Text style={[styles.subtitle, styles.headerSubtitle]}>
                            {subtitle}
                        </Text>
                    )}
                    <TextInput
                        style={styles.notesInput}
                        value={vm.workout.notes}
                        placeholder="Notes"
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        onChangeText={vm.onChangeWorkoutNotes}
                    />
                </View>
            </View>
        );
    };

    const renderModals = () => (
        <>
            <ExerciseListModal
                isVisible={vm.isModalActive(ModalType.ExerciseList)}
                onAddExercise={vm.onAddExercise}
                onCreateExerciseDef={vm.onCreateExerciseDef}
                onUpdateExerciseDef={vm.onUpdateExerciseDef}
                onDeleteExerciseDef={vm.onDeleteExerciseDef}
                onMergeExerciseDefs={vm.onMergeExerciseDefs}
                onClose={() => vm.setActiveModal(ModalType.None)}
            />
            <ExerciseHistoryModal
                isVisible={vm.isModalActive(ModalType.ExerciseHistory)}
                exerciseId={vm.historyExerciseId}
                highlightWorkoutId={vm.isHistoryMode ? vm.workout.id : null}
                onSelectWorkout={vm.onSelectExerciseHistoryWorkout}
                onClose={vm.onCloseExerciseHistory}
            />
        </>
    );

    const renderExercise = (exercise: Exercise, exerciseIdx: number) => {
        const notesExpanded = vm.isNotesExpanded(exercise);
        const hasNotes = exercise.notes.length > 0;
        const isUnknownExercise =
            exercise.exerciseId === UNKNOWN_EXERCISE_DEF_ID;

        const prevExercise = vm.workout.exercises[exerciseIdx - 1];
        const isPrevLocked = prevExercise?.sets.some(
            (set: Set) => set.finishTime !== undefined
        );
        const isMoveUpVisible = exerciseIdx > 0 && !isPrevLocked;

        return (
            <View key={exercise.id} style={[styles.card, styles.exerciseCard]}>
                <View style={styles.cardHeader}>
                    <TouchableOpacity
                        activeOpacity={0.3}
                        style={[
                            styles.cardHeaderTitle,
                            isUnknownExercise && styles.cardHeaderTitleDisabled,
                        ]}
                        onPress={() =>
                            vm.onShowExerciseHistory(exercise.exerciseId)
                        }
                        disabled={isUnknownExercise}
                    >
                        <Text
                            style={[
                                styles.cardTitle,
                                isUnknownExercise && styles.cardTitleDisabled,
                            ]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {vm.exerciseDefs[exercise.exerciseId]?.name}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.cardHeaderRight}>
                        {isMoveUpVisible && (
                            <TouchableOpacity
                                style={[
                                    styles.cardHeaderBtn,
                                    styles.cardHeaderBtnFirst,
                                ]}
                                onPress={() =>
                                    vm.onMoveExercise(exerciseIdx, -1)
                                }
                            >
                                <Ionicons
                                    name="chevron-up"
                                    color="white"
                                    size={20}
                                />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.cardHeaderBtn,
                                !isMoveUpVisible && styles.cardHeaderBtnFirst,
                            ]}
                            onPress={() => vm.onAddSet(exerciseIdx)}
                        >
                            <Ionicons
                                name="add-circle"
                                color="white"
                                size={20}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.cardHeaderBtn,
                                notesExpanded && styles.cardHeaderBtnActive,
                            ]}
                            onPress={() =>
                                vm.onNoteButtonPress(exercise, exerciseIdx)
                            }
                        >
                            <Ionicons
                                name={
                                    notesExpanded
                                        ? "at-circle-outline"
                                        : "at-circle"
                                }
                                color={notesExpanded ? "#2A3135" : "white"}
                                size={20}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cardHeaderBtn}
                            onPress={() => vm.onRemoveExercise(exerciseIdx)}
                        >
                            <Ionicons name="trash" color="white" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>
                {hasNotes && notesExpanded && (
                    <View>
                        {exercise.notes
                            .slice(0, 1)
                            .map((note: Note, noteIdx: number) => (
                                <View
                                    key={note.id}
                                    style={styles.noteContainer}
                                >
                                    <Deletable
                                        onDelete={() =>
                                            vm.onRemoveExerciseNote(
                                                exerciseIdx,
                                                noteIdx
                                            )
                                        }
                                    >
                                        <TextInput
                                            style={styles.note}
                                            placeholder="Note"
                                            placeholderTextColor="rgba(255, 255, 255, 0.6)"
                                            value={note.value}
                                            onChangeText={(text: string) =>
                                                vm.onChangeExerciseNotes(
                                                    exerciseIdx,
                                                    noteIdx,
                                                    text
                                                )
                                            }
                                        />
                                    </Deletable>
                                </View>
                            ))}
                    </View>
                )}
                <View>
                    <View style={styles.thead}>
                        <Text style={[styles.th, styles.narrow]}>Set</Text>
                        <Text style={styles.th}>Weight</Text>
                        <Text style={styles.th}>Reps</Text>
                        {showSetCompletionColumns && (
                            <Text style={styles.th}>Time</Text>
                        )}
                        {showSetCompletionColumns && (
                            <Text style={[styles.th, styles.narrow]} />
                        )}
                    </View>
                    <View style={styles.trs}>
                        {exercise.sets.map((set: Set, setIdx: number) =>
                            renderSet(set, setIdx, exerciseIdx)
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const handleSetInputFocus = (exerciseIdx: number) => {
        const isLastExercise =
            exerciseIdx === vm.workout.exercises.length - 1 &&
            vm.workout.exercises.length > 0;
        setIsLastExerciseInputFocused(isLastExercise);
    };

    const handleSetInputBlur = () => {
        setIsLastExerciseInputFocused(false);
    };

    const renderSet = (set: Set, setIdx: number, exerciseIdx: number) => {
        const isFinished = set.finishTime !== undefined;
        const duration = vm.calculateSetDuration(setIdx, exerciseIdx);
        const progress = vm.getSetProgress(exerciseIdx, setIdx);

        let progressStyle = undefined;
        if (progress === 1) {
            progressStyle = styles.tdImproved;
        } else if (progress === -1) {
            progressStyle = styles.tdDeclined;
        }

        const setNumber =
            vm.workout.exercises[exerciseIdx]?.sets
                .slice(0, setIdx + 1)
                .filter((entry) => entry.type === "default").length || 1;

        let setLabel = `${setNumber}`;
        if (progress === 1) {
            setLabel = "↑";
        } else if (progress === -1) {
            setLabel = "↓";
        }

        const setDisplayLabel =
            set.type === "default"
                ? setLabel
                : set.type
                      .split(/[^a-zA-Z0-9]+/)
                      .filter(Boolean)
                      .map((part) => part[0]?.toUpperCase() ?? "")
                      .join("")
                      .slice(0, 2);

        const setLabelGesture = isFinished
            ? Gesture.Exclusive(
                  Gesture.Tap()
                      .numberOfTaps(2)
                      .runOnJS(true)
                      .onStart(() => vm.copyToCurrentSet(exerciseIdx, setIdx)),
                  Gesture.Tap()
                      .numberOfTaps(1)
                      .runOnJS(true)
                      .onStart(() => vm.onCycleSetType(exerciseIdx, setIdx))
              )
            : Gesture.Tap()
                  .numberOfTaps(1)
                  .runOnJS(true)
                  .onStart(() => vm.onCycleSetType(exerciseIdx, setIdx));

        return (
            <View style={styles.setSwipeContainer} key={set.id}>
                <Deletable onDelete={() => vm.onRemoveSet(exerciseIdx, setIdx)}>
                    <View style={[styles.tr, isFinished && styles.finished]}>
                        <GestureDetector gesture={setLabelGesture}>
                            <View
                                style={[
                                    styles.td,
                                    styles.narrow,
                                    styles.tdReadOnly,
                                    isFinished && styles.tdFinished,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.setLabelText,
                                        set.type === "warmup" &&
                                            styles.setLabelTextWarmup,
                                        set.type === "drop" &&
                                            styles.setLabelTextDrop,
                                        progressStyle,
                                    ]}
                                >
                                    {setDisplayLabel}
                                </Text>
                            </View>
                        </GestureDetector>
                        <AdjustableNumberInput
                            value={set.weight}
                            step={0.5}
                            onAdjust={(delta) =>
                                vm.onAdjustWeight(exerciseIdx, setIdx, delta)
                            }
                            onChangeText={(text: string) =>
                                vm.onChangeWeight(exerciseIdx, setIdx, text)
                            }
                            onFocus={() => handleSetInputFocus(exerciseIdx)}
                            onBlur={handleSetInputBlur}
                            inputMode="decimal"
                            isFinished={isFinished}
                            shakeKey={
                                shakeErrors[`${exerciseIdx}-${setIdx}-weight`]
                            }
                        />
                        <AdjustableNumberInput
                            value={set.reps}
                            step={1}
                            onAdjust={(delta) =>
                                vm.onAdjustReps(exerciseIdx, setIdx, delta)
                            }
                            onChangeText={(text: string) =>
                                vm.onChangeRep(exerciseIdx, setIdx, text)
                            }
                            onFocus={() => handleSetInputFocus(exerciseIdx)}
                            onBlur={handleSetInputBlur}
                            inputMode="decimal"
                            isFinished={isFinished}
                            shakeKey={
                                shakeErrors[`${exerciseIdx}-${setIdx}-reps`]
                            }
                        />
                        {showSetCompletionColumns && (
                            <TextInput
                                style={[
                                    styles.td,
                                    styles.tdReadOnly,
                                    isFinished && styles.tdFinished,
                                ]}
                                value={duration ?? ""}
                                editable={false}
                            />
                        )}
                        {showSetCompletionColumns && (
                            <TouchableOpacity
                                style={styles.tdBtn}
                                onPress={() => {
                                    if (!isFinished) {
                                        const empty = [
                                            set.weight.trim() === "" &&
                                                "weight",
                                            set.reps.trim() === "" && "reps",
                                        ].filter(Boolean) as string[];
                                        if (empty.length > 0) {
                                            shakeEmpty(
                                                exerciseIdx,
                                                setIdx,
                                                empty
                                            );
                                            return;
                                        }
                                    }
                                    vm.onFinishSet(
                                        exerciseIdx,
                                        setIdx,
                                        !isFinished
                                    );
                                }}
                            >
                                <Ionicons
                                    name={
                                        isFinished
                                            ? "checkbox"
                                            : "square-outline"
                                    }
                                    color={isFinished ? "#65CA79" : "white"}
                                    size={24}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </Deletable>
            </View>
        );
    };

    const renderEmptyContainer = () => (
        <View style={[styles.card, styles.emptyCard]}>
            <Ionicons name="barbell-outline" color="white" size={32} />
            <Text style={styles.emptyTitle}>No exercises yet</Text>
        </View>
    );

    const renderFooter = () => (
        <View style={[styles.card, styles.footerCard]}>
            <View style={styles.footerButtons}>
                <Button
                    label="Add"
                    colour="info"
                    onPress={vm.onOpenExerciseList}
                    style={[styles.footerButton, styles.footerButtonSpacing]}
                />
                <Button
                    label={
                        vm.isHistoryMode || vm.isTemplateMode
                            ? "Save"
                            : "Finish"
                    }
                    colour="success"
                    onPress={vm.onFinishWorkout}
                    disabled={!vm.canSaveWorkout}
                    style={[styles.footerButton, styles.footerButtonSpacing]}
                />
                <Button
                    label="Cancel"
                    colour="error"
                    onPress={vm.onCancelWorkout}
                    style={styles.footerButton}
                />
            </View>
        </View>
    );

    const renderRestTimer = () => {
        if (!isRestTimerVisible) {
            return null;
        }

        return (
            <View
                style={[
                    styles.restTimerContainer,
                    { bottom: Math.max(16, insets.bottom) },
                ]}
                pointerEvents="box-none"
            >
                <View style={styles.restTimerRow}>
                    <TouchableOpacity
                        style={styles.restAdjustButton}
                        onPress={() => vm.onAdjustRestTimer(-30)}
                    >
                        <Text style={styles.restAdjustText}>-</Text>
                    </TouchableOpacity>
                    <CountdownTimer
                        containerStyle={styles.restTimer}
                        barStyle={styles.restTimerFill}
                        labelStyle={styles.restTimerLabel}
                        remainingTime={vm.remainingRestTimeS}
                        totalTime={vm.totalRestDurationS}
                    />
                    <TouchableOpacity
                        style={styles.restAdjustButton}
                        onPress={() => vm.onAdjustRestTimer(30)}
                    >
                        <Text style={styles.restAdjustText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderStatusBarScrim = () => {
        const topInset = Math.max(insets.top, 0);

        if (topInset <= 0) {
            return null;
        }

        const blurHeight = topInset + STATUS_BAR_BLUR_EXTENSION_PX;
        const fadeStartPx = Math.max(
            topInset - STATUS_BAR_BLUR_FADE_START_OFFSET_PX,
            0
        );

        return (
            <BlurFadeBackdrop
                height={blurHeight}
                fadeStartPx={fadeStartPx}
                solidStopMin={0.28}
                solidStopMax={0.72}
                style={[styles.statusBarBlur, { height: blurHeight }]}
            />
        );
    };

    return vm.isLoading ? (
        <View style={styles.screen}>
            <SafeAreaView style={styles.container} edges={["right", "left"]}>
                <ActivityIndicator
                    style={styles.loading}
                    color="white"
                    size="large"
                />
            </SafeAreaView>
            {renderStatusBarScrim()}
        </View>
    ) : (
        <View style={styles.screen}>
            <SafeAreaView style={styles.container} edges={["right", "left"]}>
                {renderModals()}
                <GestureDetector gesture={scrollNativeGesture}>
                    <ScrollView
                        ref={scrollRef}
                        style={styles.content}
                        // Disable iOS auto-insets because this screen handles top/bottom spacing explicitly
                        contentInsetAdjustmentBehavior="never"
                        automaticallyAdjustContentInsets={false}
                        automaticallyAdjustsScrollIndicatorInsets={false}
                        contentContainerStyle={[
                            styles.contentContainer,
                            {
                                paddingTop: contentTopPadding,
                                paddingBottom: contentBottomPadding,
                            },
                        ]}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => {
                            if (isLastExerciseInputFocused) {
                                scrollToBottom();
                            }
                        }}
                    >
                        {renderHeader()}
                        {vm.workout.exercises.length > 0
                            ? vm.workout.exercises.map(renderExercise)
                            : renderEmptyContainer()}
                        {renderFooter()}
                    </ScrollView>
                </GestureDetector>
                {renderRestTimer()}
            </SafeAreaView>
            {renderStatusBarScrim()}
        </View>
    );
};

export default WorkoutView;
