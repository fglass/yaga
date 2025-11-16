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
        <View style={styles.container}>
            <Text style={styles.title}>History</Text>
            <FlatList
                data={completedWorkouts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => renderCompletedWorkout(item)}
                ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        padding: 18,
        borderRadius: 16,
        backgroundColor: "#353C42",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "white",
        marginBottom: 12,
    },
    workout: {
        paddingVertical: 6,
    },
    text: {
        color: "white",
        fontWeight: "600",
    },
    subtext: {
        color: "rgba(255, 255, 255, 0.7)",
        marginTop: 2,
        fontSize: 12,
    },
    separator: {
        height: 8,
    },
});

export default HistoryView;
