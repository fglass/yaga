import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import WorkoutView from "./workout/WorkoutView";
import PlanView from "./plan/PlanView";
import {
    QueryKey,
    initDatabase,
    saveActiveWorkout,
    useActiveWorkout,
    useWorkouts,
} from "../model/database";
import { Workout } from "../model/types";
import { useQueryClient } from "react-query";

// Run during module initialisation, before view renders
if (typeof window !== "undefined") {
    initDatabase();
}

const RootView = () => {
    // TODO: view model? move query client?
    const queryClient = useQueryClient();
    const activeWorkout = useActiveWorkout();
    const workouts = useWorkouts();

    const setActiveWorkout = async (workout: Workout | null) => {
        await saveActiveWorkout(workout);
        await queryClient.invalidateQueries(QueryKey.ActiveWorkout);
    };

    const onEndWorkout = async () => {
        await setActiveWorkout(null);
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            {activeWorkout ? (
                <WorkoutView
                    initialWorkout={activeWorkout}
                    onEnd={onEndWorkout}
                />
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

export default RootView;
