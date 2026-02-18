import React from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ModalDialog from "../../../components/ModalDialog";
import { getSetProgress } from "../workout.calculations";
import { formatNumber } from "../../../utils/util";
import { useExerciseHistoryViewModel } from "./exerciseHistory.viewModel";
import type { Set } from "../../../model/types";

interface Props {
    isVisible: boolean;
    exerciseId: string | null;
    highlightWorkoutId?: string | null;
    onSelectWorkout: (workoutId: string) => void;
    onClose: () => void;
}

const ExerciseHistoryModal = (props: Props) => {
    const {
        isLoading,
        isLoadingMore,
        displayHistorySets,
        comparisonHistorySets,
        hasMore,
        loadMore,
    } = useExerciseHistoryViewModel({
        exerciseId: props.exerciseId,
        isVisible: props.isVisible,
    });

    const formatDate = (timestamp: number) =>
        new Date(timestamp).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    const handleEndReached = () => {
        if (!hasMore) {
            return;
        }
        loadMore();
    };

    const renderHeader = () => (
        <View style={styles.tableHeader}>
            <Text style={styles.headerSetCell}>Set</Text>
            <Text style={styles.headerWeightCell}>Weight</Text>
            <Text style={styles.headerRepsCell}>Reps</Text>
        </View>
    );

    const getSetLabel = (setIdx: number, setType: Set["type"], sets: Set[]) => {
        if (setType === "default") {
            const setNumber =
                sets.slice(0, setIdx + 1).filter((set) => set.type === "default")
                    .length || 1;
            return `${setNumber}`;
        }

        return setType
            .split(/[^a-zA-Z0-9]+/)
            .filter(Boolean)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("")
            .slice(0, 2);
    };

    return (
        <ModalDialog
            title="History"
            isVisible={props.isVisible}
            onClose={props.onClose}
            maxHeight="45%"
        >
            {isLoading && displayHistorySets.length === 0 ? (
                <ActivityIndicator style={styles.loading} color="white" />
            ) : displayHistorySets.length === 0 ? (
                <Text style={styles.emptyText}>Nothing yet!</Text>
            ) : (
                <FlatList
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    data={displayHistorySets}
                    keyExtractor={(entry, index) =>
                        `history-${entry.finishedAt}-${index}`
                    }
                    ListHeaderComponent={renderHeader}
                    ListFooterComponent={
                        isLoadingMore ? (
                            <ActivityIndicator
                                style={styles.footerLoading}
                                color="white"
                            />
                        ) : null
                    }
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.3}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => {
                        const previousEntry = comparisonHistorySets[index + 1];
                        const isCurrentWorkout =
                            props.highlightWorkoutId != null &&
                            item.workoutId === props.highlightWorkoutId;
                        const onSelectWorkout = () =>
                            props.onSelectWorkout(item.workoutId);
                        return (
                            <View style={styles.session}>
                                <View style={styles.sessionHeader}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={onSelectWorkout}
                                        disabled={isCurrentWorkout}
                                    >
                                        <Text
                                            style={[
                                                styles.sessionTitle,
                                                isCurrentWorkout &&
                                                    styles.sessionTitleCurrent,
                                            ]}
                                        >
                                            {formatDate(item.finishedAt)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {item.sets.map((set, setIdx) => {
                                    const progress = getSetProgress(
                                        previousEntry?.sets,
                                        item.sets,
                                        setIdx
                                    );
                                    let progressStyle = null;
                                    if (progress === 1) {
                                        progressStyle = styles.progressImproved;
                                    } else if (progress === -1) {
                                        progressStyle = styles.progressDeclined;
                                    }
                                    const arrowLabel =
                                        progress === 1
                                            ? "↑"
                                            : progress === -1
                                            ? "↓"
                                            : "=";
                                    return (
                                        <View key={set.id} style={styles.row}>
                                            <View style={styles.setIndex}>
                                                <Text
                                                    style={[
                                                        styles.setIndexNumber,
                                                        set.type === "warmup" &&
                                                            styles.setIndexNumberWarmup,
                                                        set.type === "drop" &&
                                                            styles.setIndexNumberDrop,
                                                    ]}
                                                >
                                                    {getSetLabel(
                                                        setIdx,
                                                        set.type,
                                                        item.sets
                                                    )}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.setIndexArrow,
                                                        progress === 0
                                                            ? styles.progressNeutral
                                                            : progressStyle,
                                                    ]}
                                                >
                                                    {previousEntry != null
                                                        ? arrowLabel
                                                        : ""}
                                                </Text>
                                            </View>
                                            <Text style={styles.weightCell}>
                                                {formatNumber(set.weight)}
                                            </Text>
                                            <Text style={styles.repsCell}>
                                                {formatNumber(set.reps)}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    }}
                />
            )}
        </ModalDialog>
    );
};

const styles = StyleSheet.create({
    loading: {
        paddingVertical: 12,
    },
    footerLoading: {
        paddingVertical: 12,
    },
    emptyText: {
        color: "rgba(255, 255, 255, 0.7)",
        textAlign: "center",
        paddingVertical: 10,
    },
    scroll: {
        maxHeight: "100%",
        minHeight: 0,
    },
    scrollContent: {
        paddingBottom: 8,
    },
    session: {
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.06)",
        marginBottom: 6,
    },
    sessionHeader: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: 4,
    },
    tableHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 0,
        paddingBottom: 6,
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.08)",
    },
    headerCell: {
        flex: 1,
        textAlign: "right",
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 11,
        fontWeight: "600",
    },
    headerSetCell: {
        flex: 1,
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 11,
        fontWeight: "600",
    },
    headerWeightCell: {
        flex: 1,
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 11,
        fontWeight: "600",
    },
    headerRepsCell: {
        flex: 1,
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 11,
        fontWeight: "600",
    },
    sessionTitle: {
        color: "white",
        fontWeight: "600",
        fontSize: 12,
        letterSpacing: 0.2,
    },
    sessionTitleCurrent: {
        color: "#4DA3FF",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
        paddingHorizontal: 0,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
        marginBottom: 4,
    },
    setIndex: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    setIndexNumber: {
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 11,
        fontWeight: "600",
    },
    setIndexNumberWarmup: {
        color: "#D9B36A",
    },
    setIndexNumberDrop: {
        color: "#B07CD8",
    },
    setIndexArrow: {
        position: "absolute",
        left: 8,
        fontSize: 11,
        fontWeight: "600",
    },
    weightCell: {
        flex: 1,
        textAlign: "center",
        color: "white",
        fontSize: 12,
    },
    repsCell: {
        flex: 1,
        textAlign: "center",
        color: "white",
        fontSize: 12,
    },
    progressImproved: {
        color: "#65CA79",
    },
    progressDeclined: {
        color: "#EC6569",
    },
    progressNeutral: {
        color: "rgba(255, 255, 255, 0.45)",
    },
});

export default ExerciseHistoryModal;
