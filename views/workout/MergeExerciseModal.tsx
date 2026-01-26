import React, { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalDialog from "../../components/ModalDialog";
import type { ExerciseDef } from "../../model/types";
import { withWarning } from "../../utils/util";
import * as Haptics from "expo-haptics";

interface Props {
    isVisible: boolean;
    selectedExerciseIds: string[];
    exerciseDefs: Record<string, ExerciseDef>;
    onMerge: (
        targetExerciseId: string,
        sourceExerciseIds: string[]
    ) => Promise<void>;
    onClose: () => void;
}

const MergeExerciseModal = (props: Props) => {
    const options = useMemo(() => {
        return props.selectedExerciseIds
            .map((id) => ({
                id,
                name: props.exerciseDefs[id]?.name ?? "Unknown",
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [props.exerciseDefs, props.selectedExerciseIds]);

    const [targetId, setTargetId] = useState<string | null>(null);

    useEffect(() => {
        if (props.isVisible) {
            setTargetId(options[0]?.id ?? null);
        }
    }, [options, props.isVisible]);

    const onConfirm = () => {
        if (!targetId) {
            return;
        }
        const sourceIds = props.selectedExerciseIds.filter(
            (id) => id !== targetId
        );
        if (sourceIds.length === 0) {
            return;
        }
        withWarning(async () => {
            try {
                await props.onMerge(targetId, sourceIds);
            } finally {
                props.onClose();
            }
        });
    };

    return (
        <ModalDialog
            title="Merge Exercises"
            isVisible={props.isVisible}
            onClose={props.onClose}
            maxHeight="60%"
        >
            <View style={styles.container}>
                <Text style={styles.subtitle}>Keep as</Text>
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {options.map((option) => {
                        const isSelected = option.id === targetId;
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.option,
                                    isSelected && styles.optionSelected,
                                ]}
                                onPress={() => {
                                    setTargetId(option.id);
                                    if (!isSelected) {
                                        Haptics.selectionAsync();
                                    }
                                }}
                            >
                                <Text style={styles.optionText}>
                                    {option.name}
                                </Text>
                                <Ionicons
                                    name={
                                        isSelected
                                            ? "radio-button-on"
                                            : "radio-button-off"
                                    }
                                    color={isSelected ? "#58A5F9" : "white"}
                                    size={18}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                <Text style={styles.note}>
                    Merge {props.selectedExerciseIds.length} exercises and
                    reassign past workouts
                </Text>
                <TouchableOpacity
                    style={[
                        styles.mergeButton,
                        !targetId && styles.mergeButtonDisabled,
                    ]}
                    onPress={onConfirm}
                    disabled={!targetId}
                >
                    <Text style={styles.mergeButtonText}>Merge</Text>
                </TouchableOpacity>
            </View>
        </ModalDialog>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    subtitle: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    list: {
        maxHeight: 220,
    },
    listContent: {
        gap: 6,
    },
    option: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    optionSelected: {
        backgroundColor: "rgba(88, 165, 249, 0.2)",
        borderColor: "rgba(88, 165, 249, 0.6)",
    },
    optionText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    note: {
        marginTop: 12,
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 12,
        lineHeight: 18,
        textAlign: "center",
    },
    mergeButton: {
        marginTop: 12,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
        backgroundColor: "#58A5F9",
    },
    mergeButtonDisabled: {
        opacity: 0.5,
    },
    mergeButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 16,
    },
});

export default MergeExerciseModal;
