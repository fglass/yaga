import React, { useEffect, useMemo } from "react";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import WorkoutView from "../views/workout/WorkoutView";
import { useWorkoutViewModel } from "../views/workout/workout.viewModel";
import {
    useActiveWorkout,
    useDatabaseWriter,
} from "../model/database";
import { useWorkoutNav } from "../model/context/WorkoutNavContext";
import { CompletedWorkout, Workout } from "../model/types";

type WorkoutMode = "active" | "history" | "template";

const WorkoutBottomToolbar = ({
    canSaveWorkout,
    primaryActionLabel,
    onAddExercise,
    onCancel,
    onFinish,
}: {
    canSaveWorkout: boolean;
    primaryActionLabel: "Finish" | "Save";
    onAddExercise: () => void;
    onCancel: () => void | Promise<void>;
    onFinish: () => void | Promise<void>;
}) => {
    return (
        <Stack.Toolbar>
            <Stack.Toolbar.Button
                icon="xmark"
                accessibilityLabel="Cancel workout"
                onPress={() => {
                    void onCancel();
                }}
            >
                Cancel
            </Stack.Toolbar.Button>
            <Stack.Toolbar.Spacer />
            <Stack.Toolbar.Button
                icon="plus"
                accessibilityLabel="Add exercise"
                onPress={onAddExercise}
            >
                Add
            </Stack.Toolbar.Button>
            <Stack.Toolbar.Button
                icon="checkmark.circle.fill"
                variant="prominent"
                disabled={!canSaveWorkout}
                accessibilityLabel={primaryActionLabel}
                onPress={() => {
                    void onFinish();
                }}
            >
                {primaryActionLabel}
            </Stack.Toolbar.Button>
        </Stack.Toolbar>
    );
};

const ActiveWorkoutRoute = ({
    activeWorkout,
    onNavigateToPlan,
}: {
    activeWorkout: Workout;
    onNavigateToPlan: () => void;
}) => {
    const router = useRouter();
    const { minimize: minimizeActiveWorkout } = useActiveWorkout();
    const { saveActiveWorkout } = useDatabaseWriter();

    const onFinish = async () => {
        router.replace("/(tabs)/history");
        await saveActiveWorkout(null);
    };

    const navigateAfterActiveExit = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        onNavigateToPlan();
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

    const vm = useWorkoutViewModel({
        mode: "active",
        initialWorkout: activeWorkout,
        onFinish,
        onCancel,
    });

    return (
        <>
            <WorkoutBottomToolbar
                canSaveWorkout={vm.canSaveWorkout}
                primaryActionLabel="Finish"
                onAddExercise={vm.onOpenExerciseList}
                onCancel={vm.onCancelWorkout}
                onFinish={vm.onFinishWorkout}
            />
            <WorkoutView vm={vm} onMinimize={onMinimize} />
        </>
    );
};

const HistoryWorkoutRoute = ({
    workout,
    onNavigateToHistory,
}: {
    workout: CompletedWorkout;
    onNavigateToHistory: () => void;
}) => {
    const router = useRouter();
    const onFinish = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        onNavigateToHistory();
    };

    const onCancel = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        onNavigateToHistory();
    };

    const vm = useWorkoutViewModel({
        mode: "history",
        initialWorkout: workout,
        onFinish,
        onCancel,
    });

    return (
        <>
            <WorkoutBottomToolbar
                canSaveWorkout={vm.canSaveWorkout}
                primaryActionLabel="Save"
                onAddExercise={vm.onOpenExerciseList}
                onCancel={vm.onCancelWorkout}
                onFinish={vm.onFinishWorkout}
            />
            <WorkoutView vm={vm} />
        </>
    );
};

const TemplateWorkoutRoute = ({
    workout,
    onNavigateToPlan,
}: {
    workout: Workout;
    onNavigateToPlan: () => void;
}) => {
    const router = useRouter();
    const onFinish = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        onNavigateToPlan();
    };

    const onCancel = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        onNavigateToPlan();
    };

    const vm = useWorkoutViewModel({
        mode: "template",
        initialWorkout: workout,
        onFinish,
        onCancel,
    });

    return (
        <>
            <WorkoutBottomToolbar
                canSaveWorkout={vm.canSaveWorkout}
                primaryActionLabel="Save"
                onAddExercise={vm.onOpenExerciseList}
                onCancel={vm.onCancelWorkout}
                onFinish={vm.onFinishWorkout}
            />
            <WorkoutView vm={vm} />
        </>
    );
};

const WorkoutScreen = () => {
    const router = useRouter();

    const { mode } = useLocalSearchParams<{ mode: WorkoutMode }>();
    const { consumeWorkout } = useWorkoutNav();
    const {
        activeWorkout,
        isLoading: isActiveWorkoutLoading,
        restore: restoreActiveWorkout,
    } = useActiveWorkout();

    const navigateToTab = (href: "/(tabs)/plan" | "/(tabs)/history") => {
        if (router.canGoBack()) {
            router.dismissTo(href);
            return;
        }

        router.replace(href);
    };

    // Consume workout from state (for history/template mode only)
    const navWorkout = useMemo(() => {
        if (mode === "active") {
            return null;
        }
        return consumeWorkout();
    }, [consumeWorkout, mode]);

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

        return (
            <ActiveWorkoutRoute
                activeWorkout={activeWorkout}
                onNavigateToPlan={() => navigateToTab("/(tabs)/plan")}
            />
        );
    }

    if (mode === "history") {
        if (!navWorkout) return <LoadingScreen />;
        const historyWorkout = navWorkout as CompletedWorkout;

        return (
            <HistoryWorkoutRoute
                workout={historyWorkout}
                onNavigateToHistory={() => navigateToTab("/(tabs)/history")}
            />
        );
    }

    if (mode === "template") {
        if (!navWorkout) return <LoadingScreen />;
        const templateWorkout = navWorkout as Workout;

        return (
            <TemplateWorkoutRoute
                workout={templateWorkout}
                onNavigateToPlan={() => navigateToTab("/(tabs)/plan")}
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
