import React from "react";
import {
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    View,
    LayoutChangeEvent,
} from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CompletedWorkout, AppleHealthWorkout } from "../../model/types";
import { useActiveWorkout } from "../../model/database";
import BlurFadeBackdrop from "../../components/BlurFadeBackdrop";
import {
    formatDuration,
    getWorkoutDurationSeconds,
    parseWorkoutTimestamp,
} from "../../utils/util";
import Deletable from "../../components/Deletable";
import { HistoryItem, useHistoryViewModel } from "./history.viewModel";
import { getStravaActivityId } from "./history.viewModel.helpers";
import { isAppleHealthImportedWorkout } from "../../model/health";

interface Props {
    onSelectWorkout: (workout: CompletedWorkout) => void;
    templateFilterId?: string | null;
}

const TAB_BAR_OVERLAY_HEIGHT = 56;
const MINI_BAR_MIN_BOTTOM_OFFSET = 72;
const MINI_BAR_BOTTOM_OFFSET = 60;
const MINI_BAR_HEIGHT = 42;
const MINI_BAR_CLEARANCE_GAP = 8;
const HEADER_BOTTOM_GAP = 18;
const FALLBACK_HEADER_HEIGHT = 66;
const SCRIM_FADE_HEIGHT = 24;
const SCRIM_FADE_START_OFFSET = 32;
const SCRIM_LOW_FADE_TOP_OFFSET = 8;
const SCRIM_LOW_FADE_HEIGHT = 14;

const HistoryView = (props: Props) => {
    const isTemplateFilterActive =
        typeof props.templateFilterId === "string" &&
        props.templateFilterId.trim().length > 0;
    const {
        combinedHistory,
        onDeleteLocalWorkout,
        onSelectLocalWorkout,
        isLocalWorkoutSelectable,
        formatWorkoutDate,
    } = useHistoryViewModel({
        onSelectLocalWorkout: props.onSelectWorkout,
        templateFilterId: props.templateFilterId,
    });

    const { activeWorkout, isMinimized } = useActiveWorkout();
    const insets = useSafeAreaInsets();
    const [headerHeight, setHeaderHeight] = React.useState(
        FALLBACK_HEADER_HEIGHT
    );

    const baseBottomPadding = TAB_BAR_OVERLAY_HEIGHT + insets.bottom + 10;
    const isMiniBarVisible = isMinimized && activeWorkout != null;
    const miniBarTopInset =
        Math.max(
            MINI_BAR_MIN_BOTTOM_OFFSET,
            insets.bottom + MINI_BAR_BOTTOM_OFFSET
        ) +
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

    const renderHistoryItem = (item: HistoryItem) => {
        if (item.type === "local") {
            return renderLocalWorkout(item.workout);
        }
        return renderHealthWorkout(item.workout);
    };

    const renderLocalWorkout = (workout: CompletedWorkout) => {
        const workoutStartDate = parseWorkoutTimestamp(workout.startTimestamp);
        const workoutDate = formatWorkoutDate(workoutStartDate);
        const durationSeconds = getWorkoutDurationSeconds(
            workout.startTimestamp,
            workout.endTimestamp
        );

        const isRun = workout.type === "run";
        const isSelectable = isLocalWorkoutSelectable(workout);
        const hasStravaLink = getStravaActivityId(workout) != null;
        const isAppleHealthImportedRun =
            isRun && isAppleHealthImportedWorkout(workout);

        const hasLeadingEmoji = /^\p{Extended_Pictographic}/u.test(
            workout.name.trimStart()
        );
        const workoutTitle = (
            <>
                {workout.name}
                {isRun ? ` ${workout.distance?.toFixed(2)}K ` : ""}
            </>
        );

        const workoutContent = (
            <View style={[styles.workoutCard, styles.workoutCardRow]}>
                <View style={styles.workoutTextBlock}>
                    {isRun ? (
                        <View style={styles.runHeader}>
                            {!hasLeadingEmoji && (
                                <Ionicons
                                    name={
                                        isAppleHealthImportedRun
                                            ? "heart"
                                            : "walk"
                                    }
                                    color={
                                        isAppleHealthImportedRun
                                            ? "#FF6B81"
                                            : "#7AD3FF"
                                    }
                                    size={16}
                                    style={styles.runIcon}
                                />
                            )}
                            <Text style={styles.workoutTitle}>
                                {workoutTitle}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.strengthHeader}>
                            {!hasLeadingEmoji && (
                                <Ionicons
                                    name="barbell-outline"
                                    color="#7AD3FF"
                                    size={16}
                                    style={styles.strengthIcon}
                                />
                            )}
                            <Text style={styles.workoutTitle}>
                                {workoutTitle}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.workoutMeta}>
                        {workoutDate} · {formatDuration(durationSeconds)}
                    </Text>
                </View>
                {isRun && hasStravaLink ? (
                    <FontAwesome5
                        name="strava"
                        color="#FF5A1F"
                        size={17}
                        style={styles.stravaIcon}
                    />
                ) : isRun && isSelectable ? (
                    <FontAwesome5
                        name="strava"
                        color="rgba(255, 255, 255, 0.45)"
                        size={17}
                        style={styles.stravaIcon}
                    />
                ) : isSelectable ? (
                    <Ionicons name="chevron-forward" color="white" size={20} />
                ) : null}
            </View>
        );

        return (
            <View style={styles.swipeContainer}>
                <Deletable onDelete={() => onDeleteLocalWorkout(workout)}>
                    {isSelectable ? (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            delayPressIn={120}
                            accessibilityRole="button"
                            accessibilityLabel={`${workout.name} workout`}
                            onPress={() => onSelectLocalWorkout(workout)}
                        >
                            {workoutContent}
                        </TouchableOpacity>
                    ) : (
                        workoutContent
                    )}
                </Deletable>
            </View>
        );
    };

    const renderHealthWorkout = (workout: AppleHealthWorkout) => {
        const workoutDate = formatWorkoutDate(workout.startDate);
        const isRun = workout.name === "Run";

        return (
            <View style={styles.workoutCard}>
                <View style={styles.healthHeader}>
                    <Ionicons
                        name="heart"
                        color="#FF6B81"
                        size={16}
                        style={styles.healthIcon}
                    />
                    <Text style={styles.workoutTitle}>
                        {workout.name}
                        {isRun ? ` ${workout.distance?.toFixed(2)}K ` : ""}
                    </Text>
                </View>
                <Text style={styles.workoutMeta}>
                    {workoutDate} · {formatDuration(workout.durationSeconds)}
                </Text>
            </View>
        );
    };

    const renderFilteredEmptyState = () => {
        if (!isTemplateFilterActive || combinedHistory.length > 0) {
            return null;
        }

        return (
            <View style={styles.emptyCard}>
                <Text style={styles.emptySubtitle}>No history found</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={combinedHistory}
                keyExtractor={(item) =>
                    item.type === "local"
                        ? `local-${item.workout.id}`
                        : `health-${item.workout.id}`
                }
                renderItem={({ item }) => renderHistoryItem(item)}
                // Disable iOS auto-insets because this screen handles top/bottom spacing explicitly
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
                automaticallyAdjustsScrollIndicatorInsets={false}
                ListFooterComponent={() => (
                    <View style={styles.listFooterSpacing} />
                )}
                ListEmptyComponent={renderFilteredEmptyState}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={[
                    styles.listContent,
                    {
                        paddingTop: listTopPadding,
                        paddingBottom: listBottomPadding,
                    },
                ]}
                showsVerticalScrollIndicator={false}
            />
            {renderHeaderBackdrop()}
            <View
                style={[styles.header, { top: insets.top }]}
                onLayout={onHeaderLayout}
            >
                <View>
                    <Text style={styles.title}>History</Text>
                    <Text style={styles.subtitle}>
                        {isTemplateFilterActive
                            ? "Filtered by template"
                            : "Every workout counted"}
                    </Text>
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
        left: 20,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 2,
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
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 0,
    },
    listFooterSpacing: {
        height: 8,
    },
    swipeContainer: {
        borderRadius: 16,
        overflow: "hidden",
    },
    workoutCard: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 16,
        backgroundColor: "#353C42",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    workoutTitle: {
        color: "white",
        fontWeight: "600",
        fontSize: 16,
    },
    workoutMeta: {
        color: "rgba(255, 255, 255, 0.65)",
        marginTop: 4,
        fontSize: 12,
    },
    workoutCardRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    workoutTextBlock: {
        flex: 1,
        marginRight: 12,
    },
    runHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    runIcon: {
        marginRight: 6,
    },
    stravaIcon: {
        marginRight: 6,
    },
    strengthHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    strengthIcon: {
        marginRight: 6,
    },
    healthHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    healthIcon: {
        marginRight: 4,
    },
    separator: {
        height: 8,
    },
    emptyCard: {
        padding: 24,
        borderRadius: 14,
        backgroundColor: "#353C42",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        alignItems: "center",
        justifyContent: "center",
    },
    emptySubtitle: {
        color: "rgba(255, 255, 255, 0.7)",
        textAlign: "center",
    },
});

export default HistoryView;
