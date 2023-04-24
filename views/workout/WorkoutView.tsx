import React, { useCallback, useReducer, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useQueryClient } from "react-query";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";
import ExerciseListModal from "./ExerciseListModal";
import NewExerciseModal from "./NewExerciseModal";
import Button from "../../components/Button";
import CountdownTimer from "../../components/CountdownTimer";
import Timer from "../../components/Timer";
import Deletable from "../../components/Deletable";
import { ActionType, workoutProducer } from "./state";
import { createExerciseDef, useExerciseDefs } from "../../model/database";
import { Exercise, Note, Set, Workout } from "../../model/types";

const DEFAULT_REST_DURATION_S = 90;

interface Props {
    workout: Workout;
    onFinish: () => void;
}

export default (props: Props) => {
    const queryClient = useQueryClient();
    const exerciseDefs = useExerciseDefs();
    const [workout, dispatch] = useReducer(workoutProducer, props.workout);
    const [restTimerResetKey, setRestTimerResetKey] = useState(0);

    const [exerciseListModalVisible, setExerciseListModalVisible] =
        useState(false);

    const [newExerciseModalVisible, setNewExerciseModalVisible] =
        useState(false);

    const resetRestTimer = () => {
        setRestTimerResetKey((prevKey: number) => prevKey + 1);
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (args.isFinished) {
                resetRestTimer();
            }
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

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>{workout.name}</Text>
                <Timer style={styles.subtitle} />
                <TextInput
                    style={styles.subtitle}
                    value={workout.notes}
                    placeholder="Notes"
                    onChangeText={onChangeWorkoutNotes}
                />
            </View>
            <CountdownTimer
                style={styles.subtitle}
                durationS={DEFAULT_REST_DURATION_S}
                resetKey={restTimerResetKey}
                onFinish={() => alert("Rest finished!")}
            />
        </View>
    );

    const renderModals = () => (
        <>
            <NewExerciseModal
                isVisible={newExerciseModalVisible}
                onClose={() => {
                    setExerciseListModalVisible(true);
                    setNewExerciseModalVisible(false);
                }}
                onCreate={(name: string, category: string) => {
                    setNewExerciseModalVisible(false);
                    createExerciseDef(name, category).then((exerciseId) =>
                        queryClient
                            .invalidateQueries("exerciseDefs")
                            .then(() => onAddExercise({ exerciseId }))
                    );
                }}
            />
            <ExerciseListModal
                isVisible={exerciseListModalVisible}
                onClose={() => setExerciseListModalVisible(false)}
                onSelect={(exerciseId) => onAddExercise({ exerciseId })}
                onNew={() => {
                    setExerciseListModalVisible(false);
                    setNewExerciseModalVisible(true);
                }}
            />
        </>
    );

    const renderExercise = (exercise: Exercise, exerciseIdx: number) => (
        <View key={exercise.id} style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>
                        {exerciseDefs[exercise.exerciseId]?.name}
                    </Text>
                </View>
                <View style={styles.cardHeaderRight}>
                    <TouchableOpacity
                        style={styles.cardHeaderBtn}
                        onPress={() => onAddSet({ exerciseIdx })}
                    >
                        <Ionicons
                            name="ios-add-circle"
                            color="white"
                            size={24}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cardHeaderBtn}
                        onPress={() => onAddExerciseNote({ exerciseIdx })}
                    >
                        <Ionicons name="ios-attach" color="white" size={24} />
                    </TouchableOpacity>
                    {workout.exercises.length > 1 && (
                        <TouchableOpacity
                            style={styles.cardHeaderBtn}
                            onPress={() => onRemoveExercise({ exerciseIdx })}
                        >
                            <Ionicons
                                name="ios-trash"
                                color="white"
                                size={24}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <View>
                {exercise.notes.map((note: Note, noteIdx: number) => (
                    <View key={note.id} style={styles.noteContainer}>
                        <Deletable
                            onDelete={() =>
                                onRemoveExerciseNote({ exerciseIdx, noteIdx })
                            }
                        >
                            <TextInput
                                style={styles.note}
                                placeholder="Note"
                                value={note.value}
                                onChangeText={(text: string) =>
                                    onChangeExerciseNotes({
                                        exerciseIdx,
                                        noteIdx,
                                        notes: text,
                                    })
                                }
                            />
                        </Deletable>
                    </View>
                ))}
            </View>
            <View>
                <View style={styles.thead}>
                    <Text style={[styles.th, styles.narrow]}>Set</Text>
                    <Text style={styles.th}>Weight</Text>
                    <Text style={styles.th}>Reps</Text>
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

    const renderSet = (set: Set, setIdx: number, exerciseIdx: number) => (
        <Deletable
            key={set.id}
            onDelete={() =>
                onRemoveSet({
                    exerciseIdx,
                    setIdx,
                })
            }
        >
            <View style={[styles.tr, set.finished && styles.finished]}>
                <TextInput
                    style={[
                        styles.td,
                        styles.narrow,
                        set.finished && styles.tdFinished,
                    ]}
                >
                    {setIdx + 1}
                </TextInput>
                <TextInput
                    style={[styles.td, set.finished && styles.tdFinished]}
                    value={set.weight}
                    onChangeText={(text: string) =>
                        onChangeWeight({
                            exerciseIdx,
                            setIdx,
                            weight: text,
                        })
                    }
                    inputMode="numeric"
                />
                <TextInput
                    style={[styles.td, set.finished && styles.tdFinished]}
                    value={set.reps}
                    onChangeText={(text: string) =>
                        onChangeRep({
                            exerciseIdx,
                            setIdx,
                            reps: text,
                        })
                    }
                    inputMode="numeric"
                />
                <TouchableOpacity
                    style={styles.tdBtn}
                    onPress={() => {
                        onFinishSet({
                            exerciseIdx,
                            setIdx,
                            isFinished: !set.finished,
                        });
                    }}
                >
                    <Ionicons
                        name={
                            set.finished ? "ios-checkbox" : "ios-square-outline"
                        }
                        color={set.finished ? "#65CA79" : "white"}
                        size={24}
                    />
                </TouchableOpacity>
            </View>
        </Deletable>
    );

    const renderFooter = () => (
        <View style={styles.footer}>
            <Button
                label="Add"
                colour="info"
                onPress={() => setExerciseListModalVisible(true)}
            />
            <Button label="Finish" colour="success" onPress={props.onFinish} />
            <Button label="Cancel" colour="error" onPress={props.onFinish} />
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}
            {renderModals()}
            <ScrollView style={styles.content}>
                {workout.exercises.map(renderExercise)}
                {renderFooter()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 10,
        borderBottomColor: "#58A5F9",
        borderBottomWidth: 1,
    },
    footer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
    },
    subtitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "white",
        opacity: 0.5,
    },
    card: {
        flex: 1,
        padding: 10,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cardHeaderRight: {
        flexDirection: "row",
    },
    cardHeaderBtn: {
        marginLeft: 7,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        color: "#58A5F9",
    },
    noteContainer: {
        marginTop: 5,
        padding: 0,
        borderRadius: 5,
        overflow: "hidden",
    },
    note: {
        paddingLeft: 5,
        paddingVertical: 5,
        backgroundColor: "#5C5736",
        color: "#CEAF46",
    },
    thead: {
        flexDirection: "row",
        paddingVertical: 10,
    },
    th: {
        flex: 1,
        textAlign: "center",
        fontWeight: "bold",
        color: "white",
    },
    trs: {
        overflow: "hidden",
        borderRadius: 5,
    },
    tr: {
        backgroundColor: "#2A3135",
        flexDirection: "row",
        paddingVertical: 10,
    },
    td: {
        flex: 1,
        textAlign: "center",
        color: "white",
        backgroundColor: "#202428",
        padding: 2,
        marginRight: 10,
        borderRadius: 5,
    },
    tdBtn: {
        width: 30,
        padding: 0,
        marginHorizontal: 0,
        marginBottom: 0,
    },
    narrow: {
        marginLeft: 5,
        maxWidth: 30,
    },
    finished: {
        backgroundColor: "#445E4C",
    },
    tdFinished: {
        backgroundColor: "#597E5D",
    },
});
