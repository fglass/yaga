import { useCallback, useReducer } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { dummyWorkout, Exercise, Set } from "../model";
import Button from "../components/Button";
import Deletable from "../components/Deletable";
import Timer from "../components/Timer";
import { ActionType, workoutProducer } from "./state";

export default function WorkoutView() {
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

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>{workout.name}</Text>
            <Timer style={styles.subtitle} />
            <Text style={styles.subtitle}>{workout.notes}</Text>
        </View>
    );

    const renderExercise = (exercise: Exercise, exerciseIdx: number) => (
        <View key={exercise.id} style={styles.card}>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{exercise.name}</Text>
                {exercise.notes && (
                    <Text style={styles.cardSubtitle}>{exercise.notes}</Text>
                )}
                <View style={styles.table}>
                    <View style={styles.thead}>
                        <Text style={[styles.th, styles.narrow]}>Set</Text>
                        <Text style={styles.th}>Weight</Text>
                        <Text style={styles.th}>Reps</Text>
                        <Text style={[styles.th, styles.narrow]}>✅</Text>
                    </View>
                    {exercise.sets.map((set: Set, setIdx: number) =>
                        renderSet(set, setIdx, exerciseIdx)
                    )}
                </View>
                <Button
                    label="+"
                    colour="info"
                    style={styles.addSetBtn}
                    onPress={() =>
                        onAddSet({
                            exerciseIdx: exerciseIdx,
                        })
                    }
                />
            </View>
        </View>
    );

    const renderSet = (set: Set, setIdx: number, exerciseIdx: number) => (
        <Deletable
            key={set.id}
            onDelete={() =>
                onRemoveSet({
                    exerciseIdx: exerciseIdx,
                    setIdx: setIdx,
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
                            exerciseIdx: exerciseIdx,
                            setIdx: setIdx,
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
                            exerciseIdx: exerciseIdx,
                            setIdx: setIdx,
                            reps: text,
                        })
                    }
                    inputMode="numeric"
                />
                <Button
                    label={set.finished ? "✅" : "⬜️️"}
                    style={styles.tdBtn}
                    onPress={() =>
                        onFinishSet({
                            exerciseIdx: exerciseIdx,
                            setIdx: setIdx,
                        })
                    }
                />
            </View>
        </Deletable>
    );

    const renderFooter = () => (
        <View style={styles.footer}>
            <Button label="Add" colour="info" onPress={() => alert("add")} />
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
            <ScrollView style={styles.content}>
                {renderHeader()}
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
        flexDirection: "row",
        padding: 10,
    },
    cardContent: {
        flex: 1,
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
