import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import WorkoutView from "./workout/WorkoutView";
import PlanView from "./plan/PlanView";
import {
    initDatabase,
    useActiveWorkout,
    useDatabaseWriter,
} from "../model/database";

// Run during module initialisation, before view renders
if (typeof window !== "undefined") {
    initDatabase();
}

const RootView = () => {
    const activeWorkout = useActiveWorkout();
    const { saveActiveWorkout } = useDatabaseWriter();
    const onEndWorkout = async () => await saveActiveWorkout(null);

    return (
        <GestureHandlerRootView style={styles.container}>
            {activeWorkout ? (
                <WorkoutView
                    initialWorkout={activeWorkout}
                    onEnd={onEndWorkout}
                />
            ) : (
                <PlanView />
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
