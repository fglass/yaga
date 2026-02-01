import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ExerciseListModal from "./ExerciseListModal";
import ExerciseHistoryModal from "./exerciseHistory/ExerciseHistoryModal";
import AdjustableNumberInput from "./AdjustableNumberInput";
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
import { UNKNOWN_EXERCISE_DEF_ID } from "../../model/database";

type ActiveProps = {
    mode: "active";
    initialWorkout: Workout;
    onFinish: () => Promise<void>;
    onCancel: () => Promise<void>;
};

type HistoryProps = {
    mode: "history";
    initialWorkout: CompletedWorkout;
    onFinish: () => Promise<void>;
    onCancel: () => Promise<void>;
};

type Props = ActiveProps | HistoryProps;

const WorkoutView = (props: Props) => {
    const vm = useWorkoutViewModel(props);
    const scrollRef = useRef<ScrollView>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isLastExerciseInputFocused, setIsLastExerciseInputFocused] =
        useState(false);

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

    const isRestTimerVisible = !vm.isHistoryMode && vm.remainingRestTimeS >= 0;

    const contentBottomPadding = useMemo(() => {
        if (isLastExerciseInputFocused) {
            return 16 + keyboardHeight;
        }

        return isRestTimerVisible ? 64 : 16;
    }, [isLastExerciseInputFocused, keyboardHeight, isRestTimerVisible]);

    const renderHeader = () => {
        return (
            <View style={[styles.card, styles.headerCard]}>
                <View style={styles.headerText}>
                    <Text style={styles.title}>{vm.workout.name}</Text>
                    <Text style={[styles.subtitle, styles.headerSubtitle]}>
                        {vm.isHistoryMode
                            ? vm.startDateLabel
                            : formatTime(vm.workoutDurationS)}
                    </Text>
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
                highlightWorkoutId={
                    vm.isHistoryMode ? vm.workout.id : null
                }
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
                        <Text style={styles.th}>Time</Text>
                        <Text style={[styles.th, styles.narrow]} />
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
        return (
            <View style={styles.setSwipeContainer} key={set.id}>
                <Deletable onDelete={() => vm.onRemoveSet(exerciseIdx, setIdx)}>
                    <View style={[styles.tr, isFinished && styles.finished]}>
                        {isFinished ? (
                            <GestureDetector
                                gesture={Gesture.Tap()
                                    .numberOfTaps(2)
                                    .runOnJS(true)
                                    .onStart(() =>
                                        vm.copyToCurrentSet(exerciseIdx, setIdx)
                                    )}
                            >
                                <TextInput
                                    style={[
                                        styles.td,
                                        styles.narrow,
                                        styles.tdReadOnly,
                                        styles.tdFinished,
                                        progressStyle,
                                    ]}
                                    editable={false}
                                >
                                    {setIdx + 1}
                                </TextInput>
                            </GestureDetector>
                        ) : (
                            <TextInput
                                style={[
                                    styles.td,
                                    styles.narrow,
                                    styles.tdReadOnly,
                                    isFinished && styles.tdFinished,
                                    progressStyle,
                                ]}
                                editable={false}
                            >
                                {setIdx + 1}
                            </TextInput>
                        )}
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
                        />
                        <TextInput
                            style={[
                                styles.td,
                                styles.tdReadOnly,
                                isFinished && styles.tdFinished,
                            ]}
                            value={duration ?? ""}
                            editable={false}
                        />
                        <TouchableOpacity
                            style={styles.tdBtn}
                            onPress={() => {
                                vm.onFinishSet(
                                    exerciseIdx,
                                    setIdx,
                                    !isFinished
                                );
                            }}
                        >
                            <Ionicons
                                name={
                                    isFinished ? "checkbox" : "square-outline"
                                }
                                color={isFinished ? "#65CA79" : "white"}
                                size={24}
                            />
                        </TouchableOpacity>
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
                    onPress={() => vm.setActiveModal(ModalType.ExerciseList)}
                    style={[styles.footerButton, styles.footerButtonSpacing]}
                />
                <Button
                    label={vm.isHistoryMode ? "Save" : "Finish"}
                    colour="success"
                    onPress={vm.onFinishWorkout}
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
            <View style={styles.restTimerContainer} pointerEvents="box-none">
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

    return vm.isLoading ? (
        <ActivityIndicator style={styles.loading} color="white" size="large" />
    ) : (
        <View style={styles.container}>
            {renderModals()}
            <ScrollView
                ref={scrollRef}
                style={styles.content}
                contentContainerStyle={[
                    styles.contentContainer,
                    { paddingBottom: contentBottomPadding },
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
            {renderRestTimer()}
        </View>
    );
};

export default WorkoutView;
