import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import WorkoutView from "./workout/WorkoutView";
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

// Run during module initialisation, before view renders
if (typeof window !== "undefined") {
    initDatabase();
}

const RootView = () => {
    const activeWorkout = useActiveWorkout();
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

    const renderTab = () => {
        switch (activeTab) {
            case "plan":
                return <PlanView />;
            case "history":
                return <HistoryView />;
            case "home":
            default:
                return <HomeView />;
        }
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            {activeWorkout ? (
                <WorkoutView
                    initialWorkout={activeWorkout}
                    onFinish={onFinishWorkout}
                    onCancel={onCancelWorkout}
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
    nonWorkoutContainer: {
        flex: 1,
    },
    contentArea: {
        flex: 1,
    },
});

export default RootView;
