import React from "react";
import { Text, StyleSheet, FlatList, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CompletedWorkout, AppleHealthWorkout } from "../../model/types";
import {
    formatTime,
    getWorkoutDurationSeconds,
    parseWorkoutTimestamp,
} from "../../utils/util";
import Deletable from "../../components/Deletable";
import { HistoryItem, useHistoryViewModel } from "./viewModel";

const HistoryView = () => {
    const {
        combinedHistory,
        isAppleHealthLoading,
        onDeleteLocalWorkout,
        formatWorkoutDate,
    } = useHistoryViewModel();

    const renderHistoryItem = (item: HistoryItem) => {
        if (item.type === "local") {
            return renderLocalWorkout(item.workout);
        }
        return renderHealthWorkout(item.workout);
    };

    const renderLocalWorkout = (workout: CompletedWorkout) => {
        const workoutStartDate = parseWorkoutTimestamp(workout.startTimestamp);
        const workoutDate = formatWorkoutDate(workoutStartDate);
        const durationSeconds = getWorkoutDurationSeconds(
            workout.startTimestamp,
            workout.endTimestamp
        );
        const isRun = workout.type === "run";

        return (
            <View style={styles.swipeContainer}>
                <Deletable onDelete={() => onDeleteLocalWorkout(workout)}>
                    <View key={workout.id} style={styles.workoutCard}>
                        <Text style={styles.workoutTitle}>
                            {workout.name}
                            {isRun ? ` ${workout.distance!.toFixed(2)}K ` : ""}
                        </Text>
                        <Text style={styles.workoutMeta}>
                            {workoutDate} · {formatTime(durationSeconds)}
                        </Text>
                    </View>
                </Deletable>
            </View>
        );
    };

    const renderHealthWorkout = (workout: AppleHealthWorkout) => {
        const workoutDate = formatWorkoutDate(workout.startDate);
        return (
            <View style={styles.workoutCard}>
                <View style={styles.healthHeader}>
                    <Ionicons
                        name="heart"
                        color="#FF6B81"
                        size={16}
                        style={styles.healthIcon}
                    />
                    <Text style={styles.workoutTitle}>{workout.name}</Text>
                </View>
                <Text style={styles.workoutMeta}>
                    {workoutDate} · {formatTime(workout.durationSeconds)}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>History</Text>
                    <Text style={styles.subtitle}>Every workout counted</Text>
                </View>
            </View>
            {combinedHistory.length === 0 && isAppleHealthLoading ? (
                <View style={styles.emptyCard}>
                    <Ionicons name="time-outline" color="white" size={32} />
                    <Text style={styles.emptyTitle}>
                        Syncing Apple Health...
                    </Text>
                </View>
            ) : combinedHistory.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Ionicons name="barbell-outline" color="white" size={32} />
                    <Text style={styles.emptyTitle}>No workouts yet</Text>
                </View>
            ) : (
                <FlatList
                    data={combinedHistory}
                    keyExtractor={(item) =>
                        item.type === "local"
                            ? `local-${item.workout.id}`
                            : `health-${item.workout.id}`
                    }
                    renderItem={({ item }) => renderHistoryItem(item)}
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "white",
    },
    subtitle: {
        marginTop: 4,
        color: "rgba(255, 255, 255, 0.7)",
        marginBottom: 6,
    },
    listContent: {
        paddingBottom: 24,
    },
    swipeContainer: {
        borderRadius: 16,
        overflow: "hidden",
    },
    workoutCard: {
        paddingVertical: 10,
        paddingHorizontal: 15,
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
        color: "rgba(255, 255, 255, 0.65)",
        marginTop: 4,
        fontSize: 12,
    },
    healthHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    healthIcon: {
        marginRight: 4,
    },
    separator: {
        height: 8,
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
