import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActionSheetIOS } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { exportDatabase, importDatabase, resetDatabase } from "../../model/database";
import ImportView from "../import/ImportView";
import { useHomeViewModel } from "./home.viewModel";

const HomeView = () => {
    const vm = useHomeViewModel();

    const isDevBuild = process.env.EXPO_PUBLIC_APP_VARIANT === "development";

    const onAdminSettings = () =>
        ActionSheetIOS.showActionSheetWithOptions(
            {
                title: "Settings",
                options: [
                    "Cancel",
                    vm.isHealthLoggingEnabled
                        ? "Disable Health Logging"
                        : "Enable Health Logging",
                    vm.isStravaLoggingEnabled
                        ? "Disable Strava Logging"
                        : "Enable Strava Logging",
                    "Auth Strava",
                    "Import Strong App",
                    "Export Database",
                    "Import Database",
                    "Reset Database",
                ],
                cancelButtonIndex: 0,
                destructiveButtonIndex: [6, 7],
            },
            (btnIdx) => {
                if (btnIdx === 1) {
                    vm.toggleHealthLogging();
                } else if (btnIdx === 2) {
                    vm.toggleStravaLogging();
                } else if (btnIdx === 3) {
                    void vm.authStrava();
                } else if (btnIdx === 4) {
                    void vm.openImportFromStrong();
                } else if (btnIdx === 5) {
                    exportDatabase();
                } else if (btnIdx === 6) {
                    importDatabase();
                } else if (btnIdx === 7) {
                    resetDatabase();
                }
            }
        );

    const statCards = [
        {
            id: "week",
            iconName: "barbell-outline" as const,
            iconColor: "#7AD3FF",
            label: "Week",
            thisLabel: "This",
            thisValue: vm.workoutsThisWeek,
            lastLabel: "Last",
            lastValue: vm.workoutsLastWeek,
        },
        {
            id: "month",
            iconName: "barbell-outline" as const,
            iconColor: "#9BE28A",
            label: "Month",
            thisLabel: "This",
            thisValue: vm.workoutsThisMonth,
            lastLabel: "Last",
            lastValue: vm.workoutsLastMonth,
        },
        {
            id: "year",
            iconName: "barbell-outline" as const,
            iconColor: "#FFC266",
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
            thisValue: vm.runDistanceThisWeek,
            lastLabel: "Last",
            lastValue: vm.runDistanceLastWeek,
            isDistance: true,
        },
        {
            id: "run-month",
            iconName: "walk" as const,
            iconColor: "#9BE28A",
            label: "Month",
            thisLabel: "This",
            thisValue: vm.runDistanceThisMonth,
            lastLabel: "Last",
            lastValue: vm.runDistanceLastMonth,
            isDistance: true,
        },
        {
            id: "run-year",
            iconName: "walk" as const,
            iconColor: "#FFC266",
            label: "Year",
            thisLabel: "This",
            thisValue: vm.runDistanceThisYear,
            lastLabel: "Last",
            lastValue: vm.runDistanceLastYear,
            isDistance: true,
        },
    ];

    const interleavedCards = statCards.flatMap((card, index) => [
        card,
        runningCards[index],
    ]);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.headerTopRow}>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.title}>YAGA</Text>
                        {isDevBuild ? (
                            <Text style={styles.devBadge}>DEV</Text>
                        ) : null}
                    </View>
                    <TouchableOpacity
                        style={styles.adminButton}
                        onPress={onAdminSettings}
                    >
                        <Ionicons
                            name="settings-sharp"
                            color="white"
                            size={20}
                        />
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Yet Another Gym App</Text>
            </View>
            <View style={styles.statsGrid}>
                {interleavedCards.map((card) => (
                    <View key={card.id} style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Ionicons
                                name={card.iconName}
                                color={card.iconColor}
                                size={20}
                                style={styles.statIcon}
                            />
                            <Text style={styles.statLabel}>{card.label}</Text>
                            {"isDistance" in card && card.isDistance ? (
                                <Text style={styles.statLabelUnit}>km</Text>
                            ) : null}
                        </View>
                        <View style={styles.statComparisonRow}>
                            <View style={styles.statComparison}>
                                <Text style={styles.statComparisonLabel}>
                                    {card.thisLabel}
                                </Text>
                                {vm.isLoading ? null : (
                                    <Text style={styles.statValue}>
                                        {card.thisValue}
                                    </Text>
                                )}
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
                                {vm.isLoading ? null : (
                                    <Text style={styles.statValue}>
                                        {card.lastValue}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                ))}
            </View>
            {vm.isImportVisible && (
                <ImportView
                    isVisible={vm.isImportVisible}
                    onClose={vm.closeImportFromStrong}
                    fileUri={vm.importFileUri}
                    fileName={vm.importFileName}
                />
            )}
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
    headerRow: {
        marginBottom: 24,
    },
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    subtitle: {
        marginTop: 4,
        color: "rgba(255, 255, 255, 0.7)",
    },
    devBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(88, 165, 249, 0.2)",
        color: "#9CCBFF",
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
        overflow: "hidden",
        marginLeft: 8,
    },
    adminButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        alignItems: "center",
        justifyContent: "center",
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
        minHeight: 112,
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
    statLabelUnit: {
        marginLeft: 6,
        color: "rgba(255, 255, 255, 0.35)",
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
    },
});

export default HomeView;
