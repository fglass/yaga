import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkoutView from "./workout/WorkoutView";
import RunView from "./run/RunView";
import PlanView from "./plan/PlanView";
import HistoryView from "./history/HistoryView";
import HomeView from "./home/HomeView";
import NavigationFooter, {
    NavigationTab,
} from "../components/NavigationFooter";
import {
    initDatabase,
    useActiveWorkout,
    useDatabaseWriter,
} from "../model/database";
import { CompletedWorkout, Workout } from "../model/types";

// Run during module initialisation, before view renders
if (typeof window !== "undefined") {
    initDatabase();
}

const RootView = () => {
    // NOTE: This bridge state could be replaced with router-driven screen params/navigation
    const activeWorkout = useActiveWorkout();
    const [historyWorkout, setHistoryWorkout] =
        useState<CompletedWorkout | null>(null);
    const [createTemplate, setCreateTemplate] = useState<Workout | null>(null);

    const { saveActiveWorkout } = useDatabaseWriter();
    const [activeTab, setActiveTab] = useState<NavigationTab>("home");

    const onFinishWorkout = async () => {
        setActiveTab("history");
        await saveActiveWorkout(null);
    };
    const onCancelWorkout = async () => {
        setActiveTab("plan");
        await saveActiveWorkout(null);
    };

    const onFinishHistoryWorkout = () => {
        setHistoryWorkout(null);
        setActiveTab("history");
    };

    const onCancelHistoryWorkout = () => {
        setHistoryWorkout(null);
        setActiveTab("history");
    };

    const onFinishCreateTemplate = () => {
        setCreateTemplate(null);
        setActiveTab("plan");
    };

    const onCancelCreateTemplate = onFinishCreateTemplate;

    const renderTab = () => {
        switch (activeTab) {
            case "plan":
                return <PlanView onCreateTemplate={setCreateTemplate} />;
            case "history":
                return <HistoryView onSelectWorkout={setHistoryWorkout} />;
            case "home":
            default:
                return <HomeView />;
        }
    };

    const renderContent = () => {
        if (activeWorkout) {
            if (activeWorkout.type === "run") {
                return (
                    <RunView
                        initialRun={activeWorkout}
                        onFinish={onFinishWorkout}
                        onCancel={onCancelWorkout}
                    />
                );
            }

            return (
                <WorkoutView
                    mode="active"
                    initialWorkout={activeWorkout}
                    onFinish={onFinishWorkout}
                    onCancel={onCancelWorkout}
                />
            );
        }

        if (historyWorkout) {
            return (
                <WorkoutView
                    mode="history"
                    initialWorkout={historyWorkout}
                    onFinish={onFinishHistoryWorkout}
                    onCancel={onCancelHistoryWorkout}
                />
            );
        }

        if (createTemplate) {
            return (
                <WorkoutView
                    mode="create"
                    initialWorkout={createTemplate}
                    onFinish={onFinishCreateTemplate}
                    onCancel={onCancelCreateTemplate}
                />
            );
        }

        return (
            <View style={styles.nonWorkoutContainer}>
                <View style={styles.contentArea}>{renderTab()}</View>
                <NavigationFooter
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                />
            </View>
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView
                style={styles.safeArea}
                edges={["top", "left", "right"]}
            >
                {renderContent()}
            </SafeAreaView>
            {/* eslint-disable-next-line react/style-prop-object */}
            <StatusBar style="auto" />
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2A3135",
    },
    safeArea: {
        flex: 1,
    },
    nonWorkoutContainer: {
        flex: 1,
    },
    contentArea: {
        flex: 1,
    },
});

export default RootView;
