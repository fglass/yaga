import React from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CompletedWorkout } from "../../model/types";
import { useWorkoutNav } from "../../model/context/WorkoutNavContext";
import HistoryView from "../../views/history/HistoryView";

const HistoryScreen = () => {
    const router = useRouter();
    const { templateId } = useLocalSearchParams<{
        templateId?: string | string[];
    }>();
    const { setWorkout } = useWorkoutNav();

    const normalizedTemplateId = Array.isArray(templateId)
        ? templateId[0]
        : templateId;

    const onSelectWorkout = (workout: CompletedWorkout) => {
        setWorkout(workout);
        router.push("/workout?mode=history");
    };

    return (
        <View style={styles.container}>
            <HistoryView
                onSelectWorkout={onSelectWorkout}
                templateFilterId={normalizedTemplateId}
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

export default HistoryScreen;
