import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { initDatabase, useWorkouts } from "../model/database";
import { Workout } from "../model/types";
import WorkoutView from "./workout/WorkoutView";

export default () => {
    const [activeWorkout, setActiveWorkout] = useState<Workout | undefined>();
    const workouts = useWorkouts();

    useEffect(() => {
        initDatabase();
    }, []);

    useEffect(() => {
        if (workouts.length > 0) {
            setActiveWorkout(workouts[0]);
        }
    }, [workouts]);

    return (
        <GestureHandlerRootView style={styles.container}>
            {activeWorkout && <WorkoutView workout={activeWorkout} />}
            <StatusBar style="auto" />
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2A3135",
    },
});
