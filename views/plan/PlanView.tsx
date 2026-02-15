import React from "react";
import {
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Workout, WorkoutTemplate } from "../../model/types";
import Deletable from "../../components/Deletable";
import { usePlanViewModel } from "./plan.viewModel";

type Props = {
    onCreateTemplate: (workout: Workout) => void;
    onStartWorkout: (workout: Workout) => void;
    onStartRun: () => void;
};

const PlanView = ({ onCreateTemplate, onStartWorkout, onStartRun }: Props) => {
    const vm = usePlanViewModel({ onCreateTemplate, onStartWorkout, onStartRun });

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
        <View style={styles.swipeContainer}>
            <Deletable
                onDelete={() => vm.onDeleteTemplate(item.id)}
                rightActionRadius={16}
            >
                <TouchableOpacity
                    style={styles.workoutCard}
                    onPress={() => void vm.selectTemplate(item)}
                    onLongPress={() => vm.onTemplateActions(item)}
                    activeOpacity={0.7}
                >
                    <View>
                        <Text style={styles.workoutName}>{item.name}</Text>
                        {item.exercises.length > 0 && (
                            <Text style={styles.workoutMeta}>
                                {item.exercises.length}{" "}
                                {item.exercises.length === 1
                                    ? "exercise"
                                    : "exercises"}
                            </Text>
                        )}
                    </View>
                    <Ionicons name="chevron-forward" color="white" size={20} />
                </TouchableOpacity>
            </Deletable>
        </View>
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Plan</Text>
                    <Text style={styles.subtitle}>Every workout counts</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.adminButton, styles.newTemplateButton]}
                        onPress={vm.createTemplate}
                    >
                        <Ionicons name="add" color="white" size={24} />
                    </TouchableOpacity>
                </View>
            </View>
            <FlatList
                data={vm.templates}
                keyExtractor={(item) => item.id}
                renderItem={renderTemplate}
                // Disable iOS auto-insets because this screen handles top/bottom spacing explicitly
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
                automaticallyAdjustsScrollIndicatorInsets={false}
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
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
    newTemplateButton: {
        backgroundColor: "#58A5F9",
    },
    listContent: {
        paddingBottom: 10,
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
    swipeContainer: {
        borderRadius: 16,
        overflow: "hidden",
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
});

export default PlanView;
