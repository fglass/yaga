import React, { useEffect, useMemo } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import WorkoutView from "../views/workout/WorkoutView";
import { useActiveWorkout, useDatabaseWriter } from "../model/database";
import { useWorkoutNav } from "../model/WorkoutNavContext";
import { CompletedWorkout, Workout } from "../model/types";

type WorkoutMode = "active" | "history" | "template";

const WorkoutScreen = () => {
    const router = useRouter();

    const { mode } = useLocalSearchParams<{ mode: WorkoutMode }>();
    const { consumeWorkout } = useWorkoutNav();
    const {
        activeWorkout,
        isLoading: isActiveWorkoutLoading,
        minimize: minimizeActiveWorkout,
        restore: restoreActiveWorkout,
    } = useActiveWorkout();
    const { saveActiveWorkout } = useDatabaseWriter();

    const navigateToTab = (href: "/(tabs)/plan" | "/(tabs)/history") => {
        if (router.canGoBack()) {
            router.dismissTo(href);
            return;
        }

        router.replace(href);
    };

    // Consume workout from state (for history/template mode only)
    const navWorkout = useMemo(() => consumeWorkout(), [consumeWorkout]);

    // Entering active mode should always clear minimized UI state
    useEffect(() => {
        if (mode === "active") {
            restoreActiveWorkout();
        }
    }, [mode, restoreActiveWorkout]);

    if (mode === "active") {
        if (isActiveWorkoutLoading || !activeWorkout) {
            return <LoadingScreen />;
        }

        const onFinish = async () => {
            router.replace("/(tabs)/history");
            await saveActiveWorkout(null);
        };

        const navigateAfterActiveExit = () => {
            if (router.canGoBack()) {
                router.back();
                return;
            }
            navigateToTab("/(tabs)/plan");
        };

        const onCancel = async () => {
            navigateAfterActiveExit();
            await saveActiveWorkout(null);
        };

        const onMinimize = async () => {
            minimizeActiveWorkout();
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigateAfterActiveExit();
        };

        return (
            <WorkoutView
                mode="active"
                initialWorkout={activeWorkout}
                onFinish={onFinish}
                onCancel={onCancel}
                onMinimize={onMinimize}
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

    if (mode === "template") {
        if (!navWorkout) return <LoadingScreen />;
        const templateWorkout = navWorkout as Workout;

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
                mode="template"
                initialWorkout={templateWorkout}
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
