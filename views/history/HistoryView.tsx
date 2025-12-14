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
import { useAppleHealthWorkouts } from "../../model/health";
import { CompletedWorkout, AppleHealthWorkout } from "../../model/types";
import { formatTime, parseWorkoutStart } from "../../util";

type HistoryItem =
    | { type: "local"; workout: CompletedWorkout }
    | { type: "health"; workout: AppleHealthWorkout };

const HistoryView = () => {
    const completedWorkouts = useCompletedWorkouts();
    const { workouts: appleHealthWorkouts, isLoading: isAppleHealthLoading } =
        useAppleHealthWorkouts();

    const sortedWorkouts = React.useMemo(() => {
        return [...completedWorkouts].sort((a, b) => {
            const aTime =
                parseWorkoutStart(a.endTimestamp, a.duration)?.getTime() ??
                Number.NEGATIVE_INFINITY;
            const bTime =
                parseWorkoutStart(b.endTimestamp, b.duration)?.getTime() ??
                Number.NEGATIVE_INFINITY;
            return bTime - aTime;
        });
    }, [completedWorkouts]);

    const combinedHistory = React.useMemo<HistoryItem[]>(() => {
        const localItems = sortedWorkouts.map<HistoryItem>((workout) => ({
            type: "local",
            workout,
        }));
        const appleItems = appleHealthWorkouts.map<HistoryItem>((workout) => ({
            type: "health",
            workout,
        }));

        const sortByDate = (item: HistoryItem): number => {
            if (item.type === "local") {
                return (
                    parseWorkoutStart(
                        item.workout.endTimestamp,
                        item.workout.duration
                    )?.getTime() ?? Number.NEGATIVE_INFINITY
                );
            }
            return item.workout.startDate.getTime();
        };

        return [...localItems, ...appleItems].sort(
            (a, b) => sortByDate(b) - sortByDate(a)
        );
    }, [sortedWorkouts, appleHealthWorkouts]);

    const renderHistoryItem = (item: HistoryItem) => {
        if (item.type === "local") {
            return renderLocalWorkout(item.workout);
        }
        return renderHealthWorkout(item.workout);
    };

    const renderLocalWorkout = (workout: CompletedWorkout) => {
        const workoutStartDate = parseWorkoutStart(
            workout.endTimestamp,
            workout.duration
        );
        const workoutDate = workoutStartDate
            ? workoutStartDate.toLocaleString()
            : "Unknown date";
        const isRun = workout.type === "run";

        return (
            <TouchableOpacity
                onPress={() => {
                    console.error("TODO: implement readonly view");
                }}
            >
                <View key={workout.id} style={styles.workoutCard}>
                    <Text style={styles.workoutTitle}>
                        {workout.name}
                        {isRun ? ` ${workout.distanceKm!.toFixed(2)}K ` : ""}
                    </Text>
                    <Text style={styles.workoutMeta}>
                        {workoutDate} · {formatTime(workout.duration)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderHealthWorkout = (workout: AppleHealthWorkout) => {
        const workoutDate = workout.startDate.toLocaleString();
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
            <Text style={styles.title}>History</Text>
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
    healthHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    healthIcon: {
        marginRight: 4,
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
