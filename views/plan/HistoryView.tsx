import React from "react";
import {
    Text,
    StyleSheet,
    FlatList,
    View,
    TouchableOpacity,
} from "react-native";
import { useCompletedWorkouts } from "../../model/database";
import { CompletedWorkout } from "../../model/types";
import { formatTime } from "../../util";

const HistoryView = () => {
    const completedWorkouts = useCompletedWorkouts();

    if (completedWorkouts.length === 0) {
        return null;
    }

    const renderCompletedWorkout = (workout: CompletedWorkout) => {
        const nSets = workout.exercises.reduce(
            (count, exercise) =>
                count +
                exercise.sets.filter((s) => s.finishTime !== undefined).length,
            0
        );
        return (
            <TouchableOpacity
                onPress={() => {
                    console.error("TODO: implement readonly view");
                }}
            >
                <View key={workout.id} style={styles.workout}>
                    <Text style={styles.text}>{workout.name}</Text>
                    <Text style={styles.subtext}>
                        {workout.date} — Duration:{" "}
                        {formatTime(workout.duration)} — Sets: {nSets}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <Text style={styles.title}>History</Text>
            <FlatList
                data={completedWorkouts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => renderCompletedWorkout(item)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    title: {
        marginLeft: 10,
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
    },
    workout: {
        padding: 10,
    },
    text: {
        color: "white",
    },
    subtext: {
        color: "white",
        opacity: 0.5,
    },
});

export default HistoryView;
