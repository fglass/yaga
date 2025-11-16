import React from "react";
import {
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    View,
    ActionSheetIOS,
    TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Workout } from "../../model/types";
import { exportDatabase, resetDatabase } from "../../model/database";
import HistoryView from "../history/HistoryView";
import ModalDialog from "../../components/ModalDialog";
import { usePlanViewModel } from "./viewModel";

const PlanView = () => {
    const vm = usePlanViewModel();

    const onCreateWorkoutTemplate = () => {
        void vm.createTemplate();
    };

    const onStartNewWorkout = () => {
        void vm.startBlankWorkout();
    };

    const renderNewWorkoutCard = () => (
        <TouchableOpacity
            style={[styles.workoutCard, styles.newWorkoutCard]}
            onPress={onStartNewWorkout}
        >
            <Text style={styles.workoutName}>New Workout</Text>
            <Ionicons name="chevron-forward" color="white" size={20} />
        </TouchableOpacity>
    );

    const onAdminSettings = () =>
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ["Cancel", "Export", "Reset"],
                cancelButtonIndex: 0,
                destructiveButtonIndex: 2,
            },
            (btnIdx) => {
                if (btnIdx === 1) {
                    exportDatabase();
                } else if (btnIdx === 2) {
                    resetDatabase();
                }
            }
        );

    const renderWorkout = ({ item }: { item: Workout }) => (
        <TouchableOpacity
            style={styles.workoutCard}
            onPress={() => void vm.selectWorkout(item)}
        >
            <View>
                <Text style={styles.workoutName}>{item.name}</Text>
                {item.exercises.length > 0 && (
                    <Text style={styles.workoutMeta}>
                        {item.exercises.length}{" "}
                        {item.exercises.length === 1 ? "exercise" : "exercises"}
                    </Text>
                )}
            </View>
            <Ionicons name="chevron-forward" color="white" size={20} />
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons
                name="barbell-outline"
                color="white"
                size={34}
                style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptyText}>
                Your saved templates will live here.
            </Text>
        </View>
    );

    const hasWorkouts = vm.workouts.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Plan</Text>
                    <Text style={styles.subtitle}>Every workout counts</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.adminButton, styles.newWorkoutButton]}
                        onPress={vm.openCreateModal}
                    >
                        <Ionicons name="add-sharp" color="white" size={20} />
                    </TouchableOpacity>
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
            </View>
            <FlatList
                data={vm.workouts}
                keyExtractor={(item) => item.id}
                renderItem={renderWorkout}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderNewWorkoutCard}
                ListFooterComponentStyle={styles.footerSpacing}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContent,
                    !hasWorkouts && styles.emptyListContent,
                ]}
            />
            <HistoryView />
            {vm.isCreateModalVisible && (
                <ModalDialog
                    title="New Template"
                    isVisible={vm.isCreateModalVisible}
                    onClose={vm.closeCreateModal}
                >
                    <TextInput
                        style={styles.modalInput}
                        value={vm.newWorkoutName}
                        onChangeText={vm.updateNewWorkoutName}
                        placeholder="Name"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        autoFocus
                        onSubmitEditing={onCreateWorkoutTemplate}
                    />
                    <TouchableOpacity
                        style={styles.modalCreateButton}
                        onPress={onCreateWorkoutTemplate}
                    >
                        <Text style={styles.modalCreateButtonText}>Create</Text>
                    </TouchableOpacity>
                </ModalDialog>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "white",
    },
    subtitle: {
        marginTop: 4,
        color: "rgba(255, 255, 255, 0.7)",
    },
    adminButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    newWorkoutButton: {
        backgroundColor: "#58A5F9",
        marginRight: 12,
    },
    listContent: {
        paddingBottom: 24,
    },
    emptyListContent: {
        flexGrow: 1,
        justifyContent: "center",
    },
    workoutCard: {
        padding: 18,
        borderRadius: 16,
        backgroundColor: "#353C42",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    newWorkoutCard: {
        borderColor: "rgba(88, 165, 249, 0.5)",
    },
    workoutName: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    workoutMeta: {
        color: "rgba(255, 255, 255, 0.65)",
        marginTop: 4,
        fontSize: 12,
    },
    separator: {
        height: 12,
    },
    footerSpacing: {
        marginTop: 16,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 32,
        paddingHorizontal: 20,
        borderRadius: 18,
        backgroundColor: "#353C42",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    emptyIcon: {
        marginBottom: 12,
    },
    emptyTitle: {
        color: "white",
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 6,
    },
    emptyText: {
        color: "rgba(255, 255, 255, 0.7)",
        textAlign: "center",
        lineHeight: 20,
    },
    modalDescription: {
        color: "rgba(255, 255, 255, 0.8)",
        marginBottom: 12,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: "white",
        marginBottom: 16,
    },
    modalCreateButton: {
        backgroundColor: "#58A5F9",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
    },
    modalCreateButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 16,
    },
});

export default PlanView;
