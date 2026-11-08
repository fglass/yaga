import React from "react";
import {
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    View,
    LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActiveWorkout } from "../../model/database";
import { Workout, WorkoutTemplate } from "../../model/types";
import BlurFadeBackdrop from "../../components/BlurFadeBackdrop";
import Deletable from "../../components/Deletable";
import { usePlanViewModel } from "./plan.viewModel";

const TAB_BAR_OVERLAY_HEIGHT = 56;
const MINI_BAR_BOTTOM_OFFSET = 50;
const MINI_BAR_NON_WORKOUT_LIFT = 10;
const MINI_BAR_HEIGHT = 48;
const MINI_BAR_CLEARANCE_GAP = 8;
const HEADER_BOTTOM_GAP = 18;
const FALLBACK_HEADER_HEIGHT = 66;
const SCRIM_FADE_HEIGHT = 24;
const SCRIM_FADE_START_OFFSET = 32;
const SCRIM_LOW_FADE_TOP_OFFSET = 8;
const SCRIM_LOW_FADE_HEIGHT = 14;

type Props = {
    onCreateTemplate: (workout: Workout) => void;
    onStartWorkout: (workout: Workout) => void;
    onStartRun: () => void;
};

const PlanView = ({ onCreateTemplate, onStartWorkout, onStartRun }: Props) => {
    const vm = usePlanViewModel({
        onCreateTemplate,
        onStartWorkout,
        onStartRun,
    });
    const { activeWorkout, isMinimized } = useActiveWorkout();
    const insets = useSafeAreaInsets();
    const [headerHeight, setHeaderHeight] = React.useState(
        FALLBACK_HEADER_HEIGHT
    );

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

    const renderQuickStartCards = () => (
        <View style={styles.quickStartCards}>
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

    const baseBottomPadding = TAB_BAR_OVERLAY_HEIGHT + insets.bottom + 10;
    const isMiniBarVisible = isMinimized && activeWorkout != null;
    const miniBarTopInset =
        insets.bottom +
        MINI_BAR_BOTTOM_OFFSET +
        MINI_BAR_NON_WORKOUT_LIFT +
        MINI_BAR_HEIGHT +
        MINI_BAR_CLEARANCE_GAP;
    const listBottomPadding = isMiniBarVisible
        ? Math.max(baseBottomPadding, miniBarTopInset)
        : baseBottomPadding;
    const listTopPadding = insets.top + headerHeight + HEADER_BOTTOM_GAP;

    const onHeaderLayout = (event: LayoutChangeEvent) => {
        const nextHeight = Math.ceil(event.nativeEvent.layout.height);
        if (nextHeight > 0 && nextHeight !== headerHeight) {
            setHeaderHeight(nextHeight);
        }
    };

    const renderHeaderBackdrop = () => {
        const blurHeight = Math.max(
            listTopPadding +
                (SCRIM_LOW_FADE_HEIGHT - SCRIM_LOW_FADE_TOP_OFFSET),
            0
        );
        if (blurHeight <= 0) {
            return null;
        }

        const fadeStartPx = Math.max(
            listTopPadding - SCRIM_FADE_HEIGHT - SCRIM_FADE_START_OFFSET,
            0
        );

        return (
            <BlurFadeBackdrop
                height={blurHeight}
                fadeStartPx={fadeStartPx}
                style={[styles.underHeaderBlur, { height: blurHeight }]}
            />
        );
    };

    return (
        <View style={styles.container}>
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
                ListHeaderComponent={
                    vm.isTemplatesLoading ? null : renderQuickStartCards
                }
                ListHeaderComponentStyle={styles.quickStartSpacing}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContent,
                    {
                        paddingTop: listTopPadding,
                        paddingBottom: listBottomPadding,
                    },
                ]}
            />
            {renderHeaderBackdrop()}
            <View
                style={[styles.header, { top: insets.top }]}
                onLayout={onHeaderLayout}
            >
                <View>
                    <Text style={styles.title}>Plan</Text>
                    <Text style={styles.subtitle}>Every workout counts</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.adminButton}
                        onPress={vm.createTemplate}
                    >
                        <Ionicons name="add" color="white" size={24} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    underHeaderBlur: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    header: {
        position: "absolute",
        top: 0,
        left: 20,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 2,
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
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 0,
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
    quickStartCards: {},
    quickStartSpacing: {
        marginBottom: 8,
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
