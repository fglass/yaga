import React, { useMemo } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkoutView from "../views/workout/WorkoutView";
import { useActiveWorkout, useDatabaseWriter } from "../model/database";
import { useWorkoutNav } from "../model/WorkoutNavContext";
import { CompletedWorkout, Workout } from "../model/types";

type WorkoutMode = "active" | "history" | "create";

const WorkoutScreen = () => {
    const router = useRouter();

    const { mode } = useLocalSearchParams<{ mode: WorkoutMode }>();
    const { consumeWorkout } = useWorkoutNav();

    const { activeWorkout, isLoading: isActiveWorkoutLoading } =
        useActiveWorkout();
    const { saveActiveWorkout } = useDatabaseWriter();

    const navigateToTab = (href: "/(tabs)/plan" | "/(tabs)/history") => {
        if (router.canGoBack()) {
            router.dismissTo(href);
            return;
        }

        router.replace(href);
    };

    // Consume workout from state (for history/create mode only)
    const navWorkout = useMemo(() => consumeWorkout(), [consumeWorkout]);

    if (mode === "active") {
        if (isActiveWorkoutLoading) {
            return <LoadingScreen />;
        }
        if (!activeWorkout) {
            return <LoadingScreen />;
        }

        const onFinish = async () => {
            router.replace("/(tabs)/history");
            void saveActiveWorkout(null);
        };

        const onCancel = async () => {
            if (router.canGoBack()) {
                router.back();
            } else {
                navigateToTab("/(tabs)/plan");
            }
            void saveActiveWorkout(null);
        };

        return (
            <WorkoutView
                mode="active"
                initialWorkout={activeWorkout}
                onFinish={onFinish}
                onCancel={onCancel}
            />
        );
    }

    if (mode === "history") {
        if (!navWorkout) return <LoadingScreen />;
        const historyWorkout = navWorkout as CompletedWorkout;

        const onFinish = () => {
            if (router.canGoBack()) {
                router.back();
                return;
            }
            navigateToTab("/(tabs)/history");
        };

        const onCancel = () => {
            if (router.canGoBack()) {
                router.back();
                return;
            }
            navigateToTab("/(tabs)/history");
        };

        return (
            <WorkoutView
                mode="history"
                initialWorkout={historyWorkout}
                onFinish={onFinish}
                onCancel={onCancel}
            />
        );
    }

    if (mode === "create") {
        if (!navWorkout) return <LoadingScreen />;
        const createWorkout = navWorkout as Workout;

        const onFinish = () => {
            if (router.canGoBack()) {
                router.back();
                return;
            }
            navigateToTab("/(tabs)/plan");
        };

        const onCancel = () => {
            if (router.canGoBack()) {
                router.back();
                return;
            }
            navigateToTab("/(tabs)/plan");
        };

        return (
            <WorkoutView
                mode="create"
                initialWorkout={createWorkout}
                onFinish={onFinish}
                onCancel={onCancel}
            />
        );
    }

    return <LoadingScreen />;
};

const LoadingScreen = () => {
    return <SafeAreaView style={styles.loadingContainer} />;
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: "#2A3135",
    },
});

export default WorkoutScreen;
