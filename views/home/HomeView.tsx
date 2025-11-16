import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHomeViewModel } from "./viewModel";

const HomeView = () => {
    const vm = useHomeViewModel();
    return (
        <View style={styles.container}>
            <Text style={styles.title}>YAGA</Text>
            <Text style={styles.subtitle}>Yet Another Gym App</Text>
            <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.statCardSpacer]}>
                    <Ionicons
                        name="barbell"
                        color="#58A5F9"
                        size={20}
                        style={styles.statIcon}
                    />
                    <Text style={styles.statLabel}>Workouts</Text>
                    <Text style={styles.statValue}>
                        {vm.totalCompletedWorkouts}
                    </Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons
                        name="stats-chart"
                        color="#FF9E43"
                        size={20}
                        style={styles.statIcon}
                    />
                    <Text style={styles.statLabel}>Sets</Text>
                    <Text style={styles.statValue}>
                        {vm.totalCompletedSets}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "white",
    },
    subtitle: {
        marginTop: 4,
        color: "rgba(255, 255, 255, 0.7)",
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 18,
    },
    statCard: {
        flex: 1,
        padding: 18,
        borderRadius: 16,
        backgroundColor: "#353C42",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    statCardSpacer: {
        marginRight: 12,
    },
    statIcon: {
        marginBottom: 8,
    },
    statLabel: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    statValue: {
        marginTop: 6,
        fontSize: 22,
        fontWeight: "700",
        color: "white",
    },
});

export default HomeView;
