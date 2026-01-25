import React from "react";
import {
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    View,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTemplate } from "../../model/types";
import ModalDialog from "../../components/ModalDialog";
import { usePlanViewModel } from "./plan.viewModel";

const PlanView = () => {
    const vm = usePlanViewModel();

    const onCreateWorkoutTemplate = () => {
        void vm.createTemplate();
    };

    const onStartNewWorkout = () => {
        void vm.startBlankWorkout();
    };

    const onStartNewRun = () => {
        void vm.startRun();
    };

    const renderNewWorkoutCard = () => (
        <TouchableOpacity
            style={[styles.workoutCard, styles.newWorkoutCard]}
            onPress={onStartNewWorkout}
        >
            <View style={styles.newCardContent}>
                <Text style={styles.workoutName}>New Workout</Text>
            </View>
            <Ionicons name="chevron-forward" color="white" size={20} />
        </TouchableOpacity>
    );

    const renderNewRunCard = () => (
        <TouchableOpacity
            style={[styles.workoutCard, styles.newRunCard]}
            onPress={onStartNewRun}
        >
            <View style={styles.newCardContent}>
                <Text style={styles.workoutName}>New Treadmill</Text>
            </View>
            <Ionicons name="chevron-forward" color="white" size={20} />
        </TouchableOpacity>
    );

    const renderFooterCards = () => (
        <View style={styles.footerCards}>
            {renderNewWorkoutCard()}
            {renderNewRunCard()}
        </View>
    );

    const renderTemplate = ({ item }: { item: WorkoutTemplate }) => (
        <TouchableOpacity
            style={styles.workoutCard}
            onPress={() => void vm.selectTemplate(item)}
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
            <Text style={styles.emptyTitle}>No templates yet</Text>
        </View>
    );

    const hasTemplates = vm.templates.length > 0;
    const isTemplatesEmpty = !vm.isTemplatesLoading && !hasTemplates;
    const canCreateTemplate = vm.newWorkoutName.trim().length > 0;

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
                </View>
            </View>
            <FlatList
                data={vm.templates}
                keyExtractor={(item) => item.id}
                renderItem={renderTemplate}
                ListEmptyComponent={
                    vm.isTemplatesLoading ? null : renderEmptyState
                }
                ListFooterComponent={
                    vm.isTemplatesLoading ? null : renderFooterCards
                }
                ListFooterComponentStyle={styles.footerSpacing}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContent,
                    (isTemplatesEmpty || vm.isTemplatesLoading) &&
                        styles.emptyListContent,
                ]}
            />
            {vm.isCreateModalVisible && (
                <ModalDialog
                    title="New Template"
                    isVisible={vm.isCreateModalVisible}
                    onClose={vm.closeCreateModal}
                    maxHeight="40%"
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
                        style={styles.modalKeyboard}
                    >
                        <View style={styles.modalForm}>
                            <TextInput
                                style={styles.modalInput}
                                value={vm.newWorkoutName}
                                onChangeText={vm.updateNewWorkoutName}
                                placeholder="Name"
                                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={() => {
                                    if (canCreateTemplate) {
                                        onCreateWorkoutTemplate();
                                    }
                                }}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.modalCreateButton,
                                    !canCreateTemplate &&
                                        styles.modalCreateButtonDisabled,
                                ]}
                                onPress={onCreateWorkoutTemplate}
                                disabled={!canCreateTemplate}
                            >
                                <Text style={styles.modalCreateButtonText}>
                                    Create
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
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
        fontSize: 28,
        fontWeight: "700",
        color: "white",
    },
    subtitle: {
        marginTop: 4,
        color: "rgba(255, 255, 255, 0.7)",
        marginBottom: 6,
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
        paddingVertical: 10,
        paddingHorizontal: 15,
        minHeight: 60,
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
    newRunCard: {
        borderColor: "rgba(88, 165, 249, 0.5)",
        marginTop: 8,
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
    newCardContent: {
        flex: 1,
        justifyContent: "center",
    },
    separator: {
        height: 8,
    },
    footerCards: {},
    footerSpacing: {
        marginTop: 8,
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
    modalKeyboard: {
        width: "100%",
    },
    modalForm: {
        width: "100%",
    },
    modalInput: {
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: "white",
        backgroundColor: "#2A3135",
        marginBottom: 8,
    },
    modalCreateButton: {
        backgroundColor: "#58A5F9",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    modalCreateButtonDisabled: {
        opacity: 0.5,
    },
    modalCreateButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 16,
    },
});

export default PlanView;
