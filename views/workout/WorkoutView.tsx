import React from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import ExerciseListModal from "./ExerciseListModal";
import NewExerciseModal from "./NewExerciseModal";
import Button from "../../components/Button";
import CountdownTimer from "../../components/CountdownTimer";
import Timer from "../../components/Timer";
import Deletable from "../../components/Deletable";
import { Exercise, Note, Set, Workout } from "../../model/types";
import { useWorkoutViewModel } from "./viewModel";
import { styles } from "./styles";

const DEFAULT_REST_DURATION_S = 90;

interface Props {
    workout: Workout;
    onEnd: () => void;
}

export default (props: Props) => {
    const vm = useWorkoutViewModel({ ...props });

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>{vm.workout.name}</Text>
                <Timer style={styles.subtitle} />
                <TextInput
                    style={styles.subtitle}
                    value={vm.workout.notes}
                    placeholder="Notes"
                    onChangeText={vm.onChangeWorkoutNotes}
                />
            </View>
            <CountdownTimer
                style={styles.subtitle}
                durationS={DEFAULT_REST_DURATION_S}
                resetKey={vm.restTimerResetKey}
                onFinish={() => alert("Rest finished!")}
            />
        </View>
    );

    // TODO: modal system
    const renderModals = () => (
        <>
            <NewExerciseModal
                isVisible={vm.newExerciseModalVisible}
                onClose={() => {
                    vm.setExerciseListModalVisible(true);
                    vm.setNewExerciseModalVisible(false);
                }}
                onCreate={vm.onCreateExerciseDef}
            />
            <ExerciseListModal
                isVisible={vm.exerciseListModalVisible}
                onClose={() => vm.setExerciseListModalVisible(false)}
                onSelect={(exerciseId) => vm.onAddExercise({ exerciseId })}
                onNew={() => {
                    vm.setExerciseListModalVisible(false);
                    vm.setNewExerciseModalVisible(true);
                }}
            />
        </>
    );

    const renderExercise = (exercise: Exercise, exerciseIdx: number) => (
        <View key={exercise.id} style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>
                        {vm.exerciseDefs[exercise.exerciseId]?.name}
                    </Text>
                </View>
                <View style={styles.cardHeaderRight}>
                    <TouchableOpacity
                        style={styles.cardHeaderBtn}
                        onPress={() => vm.onAddSet({ exerciseIdx })}
                    >
                        <Ionicons
                            name="ios-add-circle"
                            color="white"
                            size={24}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cardHeaderBtn}
                        onPress={() => vm.onAddExerciseNote({ exerciseIdx })}
                    >
                        <Ionicons name="ios-attach" color="white" size={24} />
                    </TouchableOpacity>
                    {vm.workout.exercises.length > 1 && (
                        <TouchableOpacity
                            style={styles.cardHeaderBtn}
                            onPress={() => vm.onRemoveExercise({ exerciseIdx })}
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
                                vm.onRemoveExerciseNote({
                                    exerciseIdx,
                                    noteIdx,
                                })
                            }
                        >
                            <TextInput
                                style={styles.note}
                                placeholder="Note"
                                value={note.value}
                                onChangeText={(text: string) =>
                                    vm.onChangeExerciseNotes({
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
                vm.onRemoveSet({
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
                        vm.onChangeWeight({
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
                        vm.onChangeRep({
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
                        vm.onFinishSet({
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
                onPress={() => vm.setExerciseListModalVisible(true)}
            />
            <Button
                label="Finish"
                colour="success"
                onPress={vm.onFinishWorkout}
            />
            <Button label="Cancel" colour="error" onPress={props.onEnd} />
        </View>
    );

    return !vm.isLoading ? (
        <View style={styles.container}>
            {renderHeader()}
            {renderModals()}
            <ScrollView style={styles.content}>
                {vm.workout.exercises.map(renderExercise)}
                {renderFooter()}
            </ScrollView>
        </View>
    ) : (
        <ActivityIndicator style={styles.loading} color="white" size="large" />
    );
};
