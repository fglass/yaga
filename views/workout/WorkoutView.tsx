import React, { useCallback, useReducer, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { dummyWorkout, exerciseDefs, Exercise, Set } from "../../model";
import ExerciseModal from "./ExerciseModal";
import Button from "../../components/Button";
import Timer from "../../components/Timer";
import Deletable from "../../components/Deletable";
import { ActionType, workoutProducer } from "./state";

export default function WorkoutView() {
    const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
    const [workout, dispatch] = useReducer(workoutProducer, dummyWorkout);

    const onChangeWeight = useCallback(
        (args) => dispatch({ type: ActionType.ChangeWeight, ...args }),
        []
    );

    const onChangeRep = useCallback(
        (args) => dispatch({ type: ActionType.ChangeReps, ...args }),
        []
    );

    const onFinishSet = useCallback(
        (args) => dispatch({ type: ActionType.FinishSet, ...args }),
        []
    );

    const onRemoveSet = useCallback(
        (args) => dispatch({ type: ActionType.RemoveSet, ...args }),
        []
    );

    const onAddSet = useCallback(
        (args) => dispatch({ type: ActionType.AddSet, ...args }),
        []
    );

    const onAddExercise = useCallback(
        (args) => dispatch({ type: ActionType.AddExercise, ...args }),
        []
    );

    const onRemoveExercise = useCallback(
        (args) => dispatch({ type: ActionType.RemoveExercise, ...args }),
        []
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>{workout.name}</Text>
            <Timer style={styles.subtitle} />
            <Text style={styles.subtitle}>{workout.notes}</Text>
        </View>
    );

    const renderExercise = (exercise: Exercise, exerciseIdx: number) => (
        <View key={exercise.id} style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>
                        {exerciseDefs[exercise.exerciseId].name}
                    </Text>
                    {exercise.notes && (
                        <Text style={styles.cardSubtitle}>
                            {exercise.notes}
                        </Text>
                    )}
                </View>
                <View style={styles.cardHeaderRight}>
                    <TouchableOpacity
                        onPress={() =>
                            onAddSet({
                                exerciseIdx,
                            })
                        }
                    >
                        <Ionicons
                            name="ios-add-circle"
                            color="white"
                            size={24}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cardHeaderBtn}
                        onPress={() => onRemoveExercise({ exerciseIdx })}
                    >
                        <Ionicons
                            name="ios-trash-outline"
                            color="white"
                            size={24}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.table}>
                <View style={styles.thead}>
                    <Text style={[styles.th, styles.narrow]}>Set</Text>
                    <Text style={styles.th}>Weight</Text>
                    <Text style={styles.th}>Reps</Text>
                    <Text style={[styles.th, styles.narrow]} />
                </View>
                {exercise.sets.map((set: Set, setIdx: number) =>
                    renderSet(set, setIdx, exerciseIdx)
                )}
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
                        set.finished && styles.finished,
                    ]}
                >
                    {setIdx + 1}
                </TextInput>
                <TextInput
                    style={[styles.td, set.finished && styles.finished]}
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
                    style={[styles.td, set.finished && styles.finished]}
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
                    onPress={() =>
                        onFinishSet({
                            exerciseIdx,
                            setIdx,
                        })
                    }
                >
                    <Ionicons
                        name={
                            set.finished ? "ios-checkbox" : "ios-square-outline"
                        }
                        color="white"
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
                onPress={() => setExerciseModalVisible(true)}
            />
            <Button
                label="Finish"
                colour="success"
                onPress={() => alert("finish")}
            />
            <Button
                label="Cancel"
                colour="error"
                onPress={() => alert("cancel")}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}
            <ExerciseModal
                isVisible={exerciseModalVisible}
                onClose={() => setExerciseModalVisible(false)}
                onSelect={(exerciseId) => onAddExercise({ exerciseId })}
            />
            <ScrollView style={styles.content}>
                {workout.exercises.map(renderExercise)}
                {renderFooter()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    header: {
        marginTop: 50,
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
        marginLeft: 5,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        color: "#58A5F9",
    },
    cardSubtitle: {
        fontSize: 14,
        marginBottom: 5,
        color: "white",
    },
    table: {},
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
    tr: {
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
    addSetBtn: {
        width: 40,
        marginTop: 5,
        marginHorizontal: 0,
    },
    narrow: {
        maxWidth: 30,
    },
    finished: {
        backgroundColor: "#65CA79",
    },
});
