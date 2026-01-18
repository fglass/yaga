import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ModalDialog from "../../components/ModalDialog";
import CategoryDropdown from "../../components/CategoryDropdown";
import { ExerciseCategory } from "../../model/types";
import { useImportViewModel } from "./viewModel";

interface Props {
    isVisible: boolean;
    onClose: () => void;
    fileUri: string | null;
    fileName: string | null;
}

const ImportView = ({
    isVisible,
    onClose,
    fileUri,
    fileName,
}: Props) => {
    const vm = useImportViewModel({ fileUri, fileName, onClose });
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState("");
    const [createName, setCreateName] = useState("");
    const [createCategory, setCreateCategory] = useState<
        ExerciseCategory | ""
    >("");
    const [mapCategory, setMapCategory] = useState<ExerciseCategory>("Other");
    const [mapName, setMapName] = useState("");
    const {
        selectedExercise,
        isCreateModalVisible,
        isSelectModalVisible,
        getSuggestedCategory,
        suggestions,
        mapping,
        exerciseOptions,
        getMappedLabel,
        knownMatches,
        getKnownLabel,
    } = vm;
    const exerciseNameById = useMemo(() => {
        return new Map(
            exerciseOptions.map((option) => [option.id, option.name])
        );
    }, [exerciseOptions]);

    useEffect(() => {
        if (selectedExercise && isCreateModalVisible) {
            setCreateName(selectedExercise);
            setCreateCategory(
                getSuggestedCategory(selectedExercise) ?? "Other"
            );
        }
    }, [selectedExercise, isCreateModalVisible, getSuggestedCategory]);

    useEffect(() => {
        if (selectedExercise && isSelectModalVisible) {
            const mapped = mapping[selectedExercise];
            const fallbackCategory =
                getSuggestedCategory(selectedExercise) ?? "Other";
            setMapCategory(
                mapped?.type === "create"
                    ? mapped.category ?? fallbackCategory
                    : fallbackCategory
            );
            setMapName(
                mapped?.type === "create" ? mapped.name : selectedExercise
            );
        }
    }, [
        selectedExercise,
        isSelectModalVisible,
        getSuggestedCategory,
        mapping,
    ]);

    const filteredOptions = useMemo(() => {
        const trimmed = searchQuery.trim().toLowerCase();
        if (!trimmed) {
            return exerciseOptions;
        }
        return exerciseOptions.filter((option) =>
            option.name.toLowerCase().includes(trimmed)
        );
    }, [searchQuery, exerciseOptions]);

    const filteredSuggestions = useMemo(() => {
        if (!selectedExercise) {
            return [];
        }
        const trimmed = searchQuery.trim().toLowerCase();
        const list = suggestions[selectedExercise] ?? [];
        if (!trimmed) {
            return list;
        }
        return list.filter((item) =>
            item.name.toLowerCase().includes(trimmed)
        );
    }, [searchQuery, selectedExercise, suggestions]);

    const canCreate = createName.trim() !== "" && createCategory !== "";
    const mapNameTrimmed = mapName.trim();
    const canMapCreate = mapNameTrimmed !== "";

    const modalOptions = useMemo(() => {
        if (!selectedExercise) {
            return [];
        }
        const suggestionIds = new Set(
            filteredSuggestions.map((item) => item.id)
        );
        const mapped = mapping[selectedExercise];
        const mappedLabelFallback = getMappedLabel(selectedExercise);
        const mappedEntry =
            mapped?.type === "existing"
                ? {
                      id: mapped.exerciseDefId,
                      name:
                          exerciseNameById.get(mapped.exerciseDefId) ??
                          mappedLabelFallback,
                      kind: "current" as const,
                  }
                : null;
        const knownId = knownMatches[selectedExercise];
        const knownLabelFallback = getKnownLabel(selectedExercise);
        const knownEntry =
            !mappedEntry && knownId
                ? {
                      id: knownId,
                      name:
                          exerciseNameById.get(knownId) ??
                          knownLabelFallback,
                      kind: "current" as const,
                  }
                : null;

        const suggestionsList = filteredSuggestions.map(
            (item) => ({
                ...item,
                kind: "suggested" as const,
            })
        );
        const filteredList = filteredOptions
            .filter((item) => !suggestionIds.has(item.id))
            .map((item) => ({
                ...item,
                kind: "existing" as const,
            }));

        return [
            ...(mappedEntry ? [mappedEntry] : []),
            ...(knownEntry ? [knownEntry] : []),
            ...suggestionsList,
            ...filteredList,
        ];
    }, [
        selectedExercise,
        mapping,
        getMappedLabel,
        knownMatches,
        getKnownLabel,
        filteredOptions,
        filteredSuggestions,
        exerciseNameById,
    ]);

    const renderExerciseRow = ({
        item,
        index,
    }: {
        item: string;
        index: number;
    }) => {
        const mappedLabel = vm.getMappedLabel(item);
        const exerciseMapping = vm.mapping[item];
        const isKnown = vm.isKnownExercise(item);
        const suggestedCategory = vm.getSuggestedCategory(item);
        let statusLabel = suggestedCategory
            ? `New · ${suggestedCategory}`
            : "New · Other";
        let statusColor = "#9BE28A";
        let statusIcon: keyof typeof Ionicons.glyphMap = "add-circle";

        if (exerciseMapping?.type === "existing") {
            statusLabel = mappedLabel;
            statusColor = "#7AD3FF";
            statusIcon = "checkmark-circle";
        } else if (exerciseMapping?.type === "create") {
            const mappedCategory = vm.getMappedCategory(item) ?? suggestedCategory;
            statusLabel = `${mappedLabel} · ${mappedCategory ?? "Other"}`;
        } else if (exerciseMapping?.type === "skip") {
            statusLabel = "Skip";
            statusColor = "#FF7A7A";
            statusIcon = "remove-circle";
        } else if (isKnown) {
            statusLabel = vm.getKnownLabel(item);
            statusColor = "#7AD3FF";
            statusIcon = "checkmark-circle";
        }

        return (
            <View
                style={[
                    styles.exerciseRow,
                    index === 0 ? styles.exerciseRowFirst : null,
                ]}
            >
                <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{item}</Text>
                    <View style={styles.statusRow}>
                        <Ionicons
                            name={statusIcon}
                            color={statusColor}
                            size={14}
                        />
                        <Text
                            style={[styles.statusText, { color: statusColor }]}
                        >
                            {statusLabel}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => vm.openSelectModal(item)}
                >
                    <Ionicons name="locate" color="white" size={16} />
                </TouchableOpacity>
            </View>
        );
    };

    const combinedExercises = useMemo(() => {
        return Array.from(
            new Set([...vm.knownExercises, ...vm.unknownExercises])
        ).sort((a, b) => a.localeCompare(b));
    }, [vm.knownExercises, vm.unknownExercises]);

    return (
        <Modal visible={isVisible} animationType="slide">
            <SafeAreaView
                style={[styles.container, { paddingTop: insets.top }]}
                edges={["top", "left", "right"]}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Import</Text>
                        <Text style={styles.fileNameSubtext}>
                            {vm.fileName ?? "CSV file"}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Ionicons name="close" color="white" size={20} />
                    </TouchableOpacity>
                </View>

                {!vm.isReady ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator color="white" />
                        <Text style={styles.emptyTitle}>Preparing import…</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.summaryHeader}>
                            <Text style={styles.summaryLine}>
                                Workouts: {vm.summary?.workoutCount ?? 0}
                            </Text>
                            <Text style={styles.summaryLine}>
                                Exercises: Known {vm.summary?.knownExercises ?? 0} · New{" "}
                                {vm.summary?.unknownExercises ?? 0} · Skip{" "}
                                {vm.summary?.skippedExercises ?? 0}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <FlatList
                            data={combinedExercises}
                            keyExtractor={(item) => item}
                            renderItem={renderExerciseRow}
                            ItemSeparatorComponent={() => (
                                <View style={styles.separator} />
                            )}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <Text style={styles.emptyTitle}>
                                    No unknown exercises.
                                </Text>
                            }
                        />

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={
                                    vm.canImport
                                        ? styles.primaryButton
                                        : [
                                              styles.primaryButton,
                                              styles.primaryButtonDisabled,
                                          ]
                                }
                                onPress={vm.runImport}
                                disabled={!vm.canImport}
                            >
                                {vm.stage === "importing" ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>
                                        Import
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </SafeAreaView>

            <ModalDialog
                title="Map Exercise"
                isVisible={vm.isSelectModalVisible}
                onClose={vm.closeSelectModal}
                maxHeight="70%"
            >
                <View style={styles.modalContent}>
                    <View style={[styles.modalSection, styles.modalSectionTight]}>
                        <Text style={styles.modalLabel}>Choose Existing</Text>
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search"
                            placeholderTextColor="rgba(255, 255, 255, 0.45)"
                        />
                        <FlatList
                            data={modalOptions}
                            keyExtractor={(item, index) =>
                                item.kind === "current"
                                    ? `current-${index}`
                                    : item.id
                            }
                            renderItem={({ item }) => {
                                const isCurrent = item.kind === "current";
                                const iconName =
                                    item.kind === "suggested"
                                        ? "sparkles"
                                        : "checkmark-circle";
                                const showIcon =
                                    item.kind === "suggested" || isCurrent;
                                const iconColor = isCurrent
                                    ? "white"
                                    : "rgba(255, 255, 255, 0.65)";
                                const textColor = isCurrent
                                    ? "white"
                                    : "white";
                                const isPressable = !isCurrent;

                                return (
                                    <TouchableOpacity
                                        style={
                                            isCurrent
                                                ? [
                                                      styles.modalOption,
                                                      styles.modalOptionCurrent,
                                                  ]
                                                : styles.modalOption
                                        }
                                        onPress={() =>
                                            isPressable &&
                                            vm.setExerciseToExisting(
                                                vm.selectedExercise ?? "",
                                                item.id
                                            )
                                        }
                                        disabled={!isPressable}
                                    >
                                        <View style={styles.modalOptionRow}>
                                            {showIcon ? (
                                                <Ionicons
                                                    name={iconName}
                                                    color={iconColor}
                                                    size={14}
                                                />
                                            ) : null}
                                            <Text
                                                style={[
                                                    styles.modalOptionText,
                                                    { color: textColor },
                                                ]}
                                            >
                                                {item.name}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ItemSeparatorComponent={() => (
                                <View style={styles.modalListSeparator} />
                            )}
                            style={styles.modalList}
                            contentContainerStyle={styles.modalListContent}
                        />
                    </View>
                    <View style={[styles.modalSection, styles.modalSectionTight]}>
                        <Text style={styles.modalLabel}>Create New</Text>
                        <TextInput
                            style={styles.searchInput}
                            value={mapName}
                            onChangeText={setMapName}
                            placeholder="Exercise name"
                            placeholderTextColor="rgba(255, 255, 255, 0.45)"
                        />
                        <CategoryDropdown
                            value={mapCategory}
                            onChange={setMapCategory}
                            containerStyle={styles.categoryDropdown}
                        />
                    </View>
                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[
                                styles.modalSecondaryButton,
                                styles.modalNewButton,
                                !canMapCreate
                                    ? styles.modalSecondaryButtonDisabled
                                    : null,
                            ]}
                            disabled={!canMapCreate}
                            onPress={() =>
                                vm.setExerciseAsNew(
                                    selectedExercise ?? "",
                                    mapNameTrimmed,
                                    mapCategory
                                )
                            }
                        >
                            <Text style={styles.modalSecondaryText}>
                                New
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modalSecondaryButton,
                                styles.modalSkipButton,
                            ]}
                            onPress={() =>
                                vm.skipExercise(vm.selectedExercise ?? "")
                            }
                        >
                            <Text style={styles.modalSecondaryText}>Skip</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ModalDialog>

            <ModalDialog
                title="Create Exercise"
                isVisible={vm.isCreateModalVisible}
                onClose={vm.closeCreateModal}
                maxHeight="60%"
            >
                <View style={styles.modalContent}>
                    <TextInput
                        style={styles.searchInput}
                        value={createName}
                        onChangeText={setCreateName}
                        placeholder="Exercise name"
                        placeholderTextColor="rgba(255, 255, 255, 0.45)"
                    />
                    <CategoryDropdown
                        value={createCategory}
                        onChange={setCreateCategory}
                        containerStyle={styles.categoryDropdown}
                    />
                    <TouchableOpacity
                        style={
                            canCreate
                                ? styles.primaryButton
                                : [
                                      styles.primaryButton,
                                      styles.primaryButtonDisabled,
                                  ]
                        }
                        disabled={!canCreate}
                        onPress={() =>
                            vm.setExerciseAsNew(
                                vm.selectedExercise ?? "",
                                createName.trim(),
                                createCategory as ExerciseCategory
                            )
                        }
                    >
                        <Text style={styles.primaryButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </ModalDialog>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2A3135",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "white",
    },
    fileNameSubtext: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 13,
        marginTop: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.6)",
        marginTop: 4,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    summaryHeader: {
        paddingBottom: 8,
    },
    summaryLine: {
        color: "white",
        fontSize: 14,
        marginBottom: 4,
    },
    summaryIndented: {
        paddingLeft: 12,
    },
    summarySubLine: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 13,
        marginBottom: 3,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        marginBottom: 0,
    },
    listContent: {
        paddingBottom: 8,
    },
    exerciseRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    exerciseRowFirst: {
        paddingTop: 8,
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: "600",
    },
    mapButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#4A90E2",
        borderRadius: 10,
    },
    mapButtonText: {
        color: "white",
        fontWeight: "600",
    },
    separator: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        marginVertical: 6,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 12,
    },
    primaryButton: {
        width: "100%",
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#2D9C6C",
        alignItems: "center",
    },
    primaryButtonDisabled: {
        opacity: 0.5,
    },
    primaryButtonText: {
        color: "white",
        fontWeight: "700",
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    emptyTitle: {
        color: "white",
        fontSize: 16,
        textAlign: "center",
    },
    modalContent: {
        gap: 12,
    },
    modalSection: {
        gap: 8,
    },
    modalSectionSpacing: {
        marginTop: 12,
    },
    modalSectionTight: {
        marginTop: 0,
    },
    modalLabel: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    modalOption: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
    modalOptionCurrent: {
        backgroundColor: "#4A90E2",
    },
    modalOptionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    modalOptionText: {
        color: "white",
        fontSize: 14,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 6,
        paddingBottom: 2,
    },
    modalSecondaryButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        alignItems: "center",
    },
    modalSecondaryButtonDisabled: {
        opacity: 0.5,
    },
    modalNewButton: {
        backgroundColor: "#2D9C6C",
    },
    modalSkipButton: {
        backgroundColor: "#C85A5A",
    },
    modalSecondaryText: {
        color: "white",
        fontWeight: "600",
    },
    searchInput: {
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#2A3135",
        color: "white",
    },
    modalList: {
        maxHeight: 170,
        minHeight: 170,
    },
    modalListContent: {
        paddingTop: 2,
        paddingBottom: 4,
    },
    modalListSeparator: {
        height: 5,
    },
    categoryDropdown: {
        marginTop: 2,
    },
});

export default ImportView;
