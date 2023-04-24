import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { initDatabase, useWorkouts } from "../model/database";
import { Workout } from "../model/types";
import WorkoutView from "./workout/WorkoutView";
import PlanView from "./plan/PlanView";

export default () => {
    const [activeWorkout, setActiveWorkout] = useState<Workout | null>();
    const workouts = useWorkouts();

    useEffect(() => {
        initDatabase();
    }, []);

    const onEnd = () => {
        setActiveWorkout(null);
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            {activeWorkout ? (
                <WorkoutView workout={activeWorkout} onEnd={onEnd} />
            ) : (
                <PlanView workouts={workouts} onSelect={setActiveWorkout} />
            )}
            <StatusBar style="auto" />
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        backgroundColor: "#2A3135",
    },
});
