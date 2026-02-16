import React from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Workout } from "../../model/types";
import { useWorkoutNav } from "../../model/WorkoutNavContext";
import PlanView from "../../views/plan/PlanView";

const PlanScreen = () => {
    const router = useRouter();
    const { setWorkout } = useWorkoutNav();

    const onCreateTemplate = (workout: Workout) => {
        setWorkout(workout);
        router.push("/workout?mode=create");
    };

    const onStartWorkout = (workout: Workout) => {
        void workout;
        router.push("/workout?mode=active");
    };

    const onStartRun = () => {
        router.push("/run");
    };

    return (
        <View style={styles.container}>
            <PlanView
                onCreateTemplate={onCreateTemplate}
                onStartWorkout={onStartWorkout}
                onStartRun={onStartRun}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2A3135",
    },
});

export default PlanScreen;
