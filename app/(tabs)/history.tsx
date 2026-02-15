import React from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CompletedWorkout } from "../../model/types";
import { useWorkoutNav } from "../../model/WorkoutNavContext";
import HistoryView from "../../views/history/HistoryView";

const HistoryScreen = () => {
    const router = useRouter();
    const { setWorkout } = useWorkoutNav();
    const insets = useSafeAreaInsets();

    const onSelectWorkout = (workout: CompletedWorkout) => {
        setWorkout(workout);
        router.push("/workout?mode=history");
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
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
