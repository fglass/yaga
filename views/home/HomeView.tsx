import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHomeViewModel } from "./viewModel";

const HomeView = () => {
    const vm = useHomeViewModel();

    const statCards = [
        {
            id: "week",
            iconName: "barbell-outline" as const,
            iconColor: "#58A5F9",
            label: "Week",
            thisLabel: "This",
            thisValue: vm.workoutsThisWeek,
            lastLabel: "Last",
            lastValue: vm.workoutsLastWeek,
        },
        {
            id: "month",
            iconName: "barbell-outline" as const,
            iconColor: "#8AF7B5",
            label: "Month",
            thisLabel: "This",
            thisValue: vm.workoutsThisMonth,
            lastLabel: "Last",
            lastValue: vm.workoutsLastMonth,
        },
        {
            id: "year",
            iconName: "barbell-outline" as const,
            iconColor: "#FF9E43",
            label: "Year",
            thisLabel: "This",
            thisValue: vm.workoutsThisYear,
            lastLabel: "Last",
            lastValue: vm.workoutsLastYear,
        },
    ];

    const runningCards = [
        {
            id: "run-week",
            iconName: "walk" as const,
            iconColor: "#7AD3FF",
            label: "Week",
            thisLabel: "This",
            thisValue: vm.runsThisWeek,
            lastLabel: "Last",
            lastValue: vm.runsLastWeek,
        },
        {
            id: "run-month",
            iconName: "walk" as const,
            iconColor: "#9BE28A",
            label: "Month",
            thisLabel: "This",
            thisValue: vm.runsThisMonth,
            lastLabel: "Last",
            lastValue: vm.runsLastMonth,
        },
        {
            id: "run-year",
            iconName: "walk" as const,
            iconColor: "#FFC266",
            label: "Year",
            thisLabel: "This",
            thisValue: vm.runsThisYear,
            lastLabel: "Last",
            lastValue: vm.runsLastYear,
        },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>YAGA</Text>
            <Text style={styles.subtitle}>Yet Another Gym App</Text>
            <View style={styles.statsGrid}>
                {statCards.map((card) => (
                    <View key={card.id} style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Ionicons
                                name={card.iconName}
                                color={card.iconColor}
                                size={20}
                                style={styles.statIcon}
                            />
                            <Text style={styles.statLabel}>{card.label}</Text>
                        </View>
                        <View style={styles.statComparisonRow}>
                            <View style={styles.statComparison}>
                                <Text style={styles.statComparisonLabel}>
                                    {card.thisLabel}
                                </Text>
                                <Text style={styles.statValue}>
                                    {card.thisValue}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.statComparison,
                                    styles.statComparisonSpacer,
                                ]}
                            >
                                <Text style={styles.statComparisonLabel}>
                                    {card.lastLabel}
                                </Text>
                                <Text style={styles.statValue}>
                                    {card.lastValue}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
            <View style={[styles.statsGrid, styles.runningGrid]}>
                {runningCards.map((card) => (
                    <View key={card.id} style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Ionicons
                                name={card.iconName}
                                color={card.iconColor}
                                size={20}
                                style={styles.statIcon}
                            />
                            <Text style={styles.statLabel}>{card.label}</Text>
                        </View>
                        <View style={styles.statComparisonRow}>
                            <View style={styles.statComparison}>
                                <Text style={styles.statComparisonLabel}>
                                    {card.thisLabel}
                                </Text>
                                <Text style={styles.statValue}>
                                    {card.thisValue}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.statComparison,
                                    styles.statComparisonSpacer,
                                ]}
                            >
                                <Text style={styles.statComparisonLabel}>
                                    {card.lastLabel}
                                </Text>
                                <Text style={styles.statValue}>
                                    {card.lastValue}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
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
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    runningGrid: {
        marginTop: 8,
    },
    statCard: {
        width: "48%",
        marginBottom: 18,
        padding: 18,
        borderRadius: 16,
        backgroundColor: "#353C42",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    statHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    statIcon: {
        marginRight: 8,
    },
    statLabel: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    statComparisonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
    },
    statComparison: {
        flex: 1,
    },
    statComparisonSpacer: {
        marginLeft: 12,
    },
    statComparisonLabel: {
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: 11,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    statValue: {
        marginTop: 6,
        fontSize: 22,
        fontWeight: "700",
        color: "white",
    },
});

export default HomeView;
