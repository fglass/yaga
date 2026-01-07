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
import { CompletedWorkout } from "../model/types";

// Run during module initialisation, before view renders
if (typeof window !== "undefined") {
    initDatabase();
}

const RootView = () => {
    const activeWorkout = useActiveWorkout();
    const [historyWorkout, setHistoryWorkout] =
        useState<CompletedWorkout | null>(null);

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

    const onFinishHistoryWorkout = async () => {
        setHistoryWorkout(null);
        setActiveTab("history");
    };

    const onCancelHistoryWorkout = async () => {
        setHistoryWorkout(null);
        setActiveTab("history");
    };

    const renderTab = () => {
        switch (activeTab) {
            case "plan":
                return <PlanView />;
            case "history":
                return <HistoryView onSelectWorkout={setHistoryWorkout} />;
            case "home":
            default:
                return <HomeView />;
        }
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView
                style={styles.safeArea}
                edges={["top", "left", "right"]}
            >
                {activeWorkout ? (
                    activeWorkout.type === "run" ? (
                        <RunView
                            initialRun={activeWorkout}
                            onFinish={onFinishWorkout}
                            onCancel={onCancelWorkout}
                        />
                    ) : (
                        <WorkoutView
                            mode="active"
                            initialWorkout={activeWorkout}
                            onFinish={onFinishWorkout}
                            onCancel={onCancelWorkout}
                        />
                    )
                ) : historyWorkout ? (
                    <WorkoutView
                        mode="history"
                        initialWorkout={historyWorkout}
                        onFinish={onFinishHistoryWorkout}
                        onCancel={onCancelHistoryWorkout}
                    />
                ) : (
                    <View style={styles.nonWorkoutContainer}>
                        <View style={styles.contentArea}>{renderTab()}</View>
                        <NavigationFooter
                            activeTab={activeTab}
                            onSelectTab={setActiveTab}
                        />
                    </View>
                )}
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
