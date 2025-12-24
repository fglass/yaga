import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import ModalDialog from "../../components/ModalDialog";
import { Set } from "../../model/types";
import { fetchRecentSetsForExercises } from "../../model/database";

interface Props {
    isVisible: boolean;
    exerciseId: string | null;
    onClose: () => void;
}

const useExerciseHistory = (exerciseId: string | null, isVisible: boolean) => {
    const [isLoading, setIsLoading] = useState(false);
    const [historySets, setHistorySets] = useState<
        { finishedAt: number; sets: Set[] }[]
    >([]);

    useEffect(() => {
        let isActive = true;
        if (!isVisible || !exerciseId) {
            setHistorySets([]);
            setIsLoading(false);
            return () => {
                isActive = false;
            };
        }

        setIsLoading(true);
        fetchRecentSetsForExercises([exerciseId], 3)
            .then((history) => {
                if (!isActive) {
                    return;
                }
                setHistorySets(history[exerciseId] ?? []);
            })
            .catch(() => {
                if (!isActive) {
                    return;
                }
                setHistorySets([]);
            })
            .finally(() => {
                if (!isActive) {
                    return;
                }
                setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [exerciseId, isVisible]);

    return { isLoading, historySets };
};

const ExerciseHistoryModal = (props: Props) => {
    const title = "History";
    const { isLoading, historySets } = useExerciseHistory(
        props.exerciseId,
        props.isVisible
    );

    const formatDate = (timestamp: number) =>
        new Date(timestamp).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    return (
        <ModalDialog
            title={title}
            isVisible={props.isVisible}
            onClose={props.onClose}
            maxHeight="70%"
        >
            {isLoading ? (
                <ActivityIndicator style={styles.loading} color="white" />
            ) : historySets.length === 0 ? (
                <Text style={styles.emptyText}>No recent sets yet.</Text>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.headerSetCell}>Set</Text>
                        <Text style={styles.headerWeightCell}>Weight</Text>
                        <Text style={styles.headerRepsCell}>Reps</Text>
                    </View>
                    {historySets.map((entry, sessionIdx) => (
                        <View
                            key={`history-${sessionIdx}`}
                            style={styles.session}
                        >
                            <View style={styles.sessionHeader}>
                                <Text style={styles.sessionTitle}>
                                    {formatDate(entry.finishedAt)}
                                </Text>
                            </View>
                            {entry.sets.map((set, setIdx) => (
                                <View key={set.id} style={styles.row}>
                                    <Text style={styles.setIndex}>
                                        {setIdx + 1}
                                    </Text>
                                    <Text style={styles.weightCell}>
                                        {set.weight}
                                    </Text>
                                    <Text style={styles.repsCell}>
                                        {set.reps}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            )}
        </ModalDialog>
    );
};

const styles = StyleSheet.create({
    loading: {
        paddingVertical: 12,
    },
    emptyText: {
        color: "rgba(255, 255, 255, 0.7)",
        textAlign: "center",
        paddingVertical: 10,
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
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.6)",
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
});

export default ExerciseHistoryModal;
