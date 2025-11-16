import React from "react";
import {
    Text,
    StyleSheet,
    FlatList,
    View,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCompletedWorkouts } from "../../model/database";
import { CompletedWorkout } from "../../model/types";
import { formatTime } from "../../util";

const HistoryView = () => {
    const completedWorkouts = useCompletedWorkouts();

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
                <View key={workout.id} style={styles.workoutCard}>
                    <Text style={styles.workoutTitle}>{workout.name}</Text>
                    <Text style={styles.workoutMeta}>
                        {workout.date} · Duration {formatTime(workout.duration)}{" "}
                        · Sets {nSets}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>History</Text>
            {completedWorkouts.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Ionicons name="barbell-outline" color="white" size={32} />
                    <Text style={styles.emptyTitle}>No workouts yet</Text>
                </View>
            ) : (
                <FlatList
                    data={completedWorkouts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => renderCompletedWorkout(item)}
                    ItemSeparatorComponent={() => (
                        <View style={styles.separator} />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "white",
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 24,
    },
    workoutCard: {
        padding: 18,
        borderRadius: 16,
        backgroundColor: "#353C42",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    workoutTitle: {
        color: "white",
        fontWeight: "600",
        fontSize: 16,
    },
    workoutMeta: {
        color: "rgba(255, 255, 255, 0.7)",
        marginTop: 4,
        fontSize: 12,
    },
    separator: {
        height: 12,
    },
    emptyCard: {
        padding: 24,
        borderRadius: 14,
        backgroundColor: "#353C42",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        alignItems: "center",
        justifyContent: "center",
    },
    emptyTitle: {
        color: "white",
        fontWeight: "600",
        fontSize: 18,
        marginBottom: 8,
    },
});

export default HistoryView;
