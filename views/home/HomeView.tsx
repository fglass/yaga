import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHomeViewModel } from "./viewModel";

const HomeView = () => {
    const vm = useHomeViewModel();
    const statCards = [
        {
            id: "week",
            iconName: "calendar" as const,
            iconColor: "#58A5F9",
            label: "Week",
            thisLabel: "This",
            thisValue: vm.workoutsThisWeek,
            lastLabel: "Last",
            lastValue: vm.workoutsLastWeek,
        },
        {
            id: "month",
            iconName: "calendar" as const,
            iconColor: "#8AF7B5",
            label: "Month",
            thisLabel: "This",
            thisValue: vm.workoutsThisMonth,
            lastLabel: "Last",
            lastValue: vm.workoutsLastMonth,
        },
        {
            id: "year",
            iconName: "calendar" as const,
            iconColor: "#FF9E43",
            label: "Year",
            thisLabel: "This",
            thisValue: vm.workoutsThisYear,
            lastLabel: "Last",
            lastValue: vm.workoutsLastYear,
        },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>YAGA</Text>
            <Text style={styles.subtitle}>Yet Another Gym App</Text>
            <View style={styles.statsGrid}>
                {statCards.map((card) => (
                    <View key={card.id} style={styles.statCard}>
                        <Ionicons
                            name={card.iconName}
                            color={card.iconColor}
                            size={20}
                            style={styles.statIcon}
                        />
                        <Text style={styles.statLabel}>{card.label}</Text>
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
    statCard: {
        width: "48%",
        marginBottom: 18,
        padding: 18,
        borderRadius: 16,
        backgroundColor: "#353C42",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
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
        color: "rgba(255, 255, 255, 0.3)",
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
