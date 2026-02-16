import React from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { CompletedWorkout } from "../../model/types";
import { useWorkoutNav } from "../../model/WorkoutNavContext";
import HistoryView from "../../views/history/HistoryView";

const HistoryScreen = () => {
    const router = useRouter();
    const { setWorkout } = useWorkoutNav();

    const onSelectWorkout = (workout: CompletedWorkout) => {
        setWorkout(workout);
        router.push("/workout?mode=history");
    };

    return (
        <View style={styles.container}>
            <HistoryView onSelectWorkout={onSelectWorkout} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2A3135",
    },
});

export default HistoryScreen;
