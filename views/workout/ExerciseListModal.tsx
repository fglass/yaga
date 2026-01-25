import React, { useMemo, useState, useEffect, useRef } from "react";
import {
    ActionSheetIOS,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExerciseDefs } from "../../model/database";
import ModalDialog from "../../components/ModalDialog";
import EditExerciseModal from "./EditExerciseModal";
import NewExerciseModal from "./NewExerciseModal";
import MergeExerciseModal from "./MergeExerciseModal";
import type { ExerciseCategory, ExerciseDef } from "../../model/types";
import { UNKNOWN_EXERCISE_DEF_ID } from "../../model/database";
import { withWarning } from "../../utils/util";
import * as Haptics from "expo-haptics";

interface Props {
    isVisible: boolean;
    onAddExercise: (exerciseId: string) => void;
    onCreateExerciseDef: (
        name: string,
        category: ExerciseCategory
    ) => Promise<void>;
    onUpdateExerciseDef: (
        exerciseId: string,
        def: ExerciseDef
    ) => Promise<void>;
    onDeleteExerciseDef: (exerciseDefId: string) => Promise<string>;
    onMergeExerciseDefs: (
        targetExerciseId: string,
        sourceExerciseIds: string[]
    ) => Promise<void>;
    onClose: () => void;
}

type ExerciseItem = [string, ExerciseDef];

const MAX_VISIBLE_ITEMS = 5;
const ITEM_HEIGHT = 44;
const ITEM_SPACING = 10;
const LIST_VERTICAL_PADDING = 0;
const MIN_LIST_ITEMS = 5;

const ExerciseListModal = (props: Props) => {
    const exerciseDefs = useExerciseDefs();

    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>(
        []
    );

    const [editingExerciseDef, setEditingExerciseDef] = useState<string | null>(
        null
    );
    const [isNewModalVisible, setIsNewModalVisible] = useState(false);
    const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);

    const suppressPressRef = useRef(false); // Skip tap after long-press opens action sheet

    const { items, listHeight, minListHeight, categories } = useMemo(() => {
        const grouped: Record<string, ExerciseItem[]> = {};
        Object.entries(exerciseDefs).forEach(([id, def]) => {
            if (id === UNKNOWN_EXERCISE_DEF_ID) {
                return;
            }
            const category = def.category?.trim().length
                ? def.category.trim()
                : "Other";
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push([id, def]);
        });

        const sectionEntries = Object.entries(grouped)
            .sort((a, b) => {
                // Move 'Other' to end
                const aIsOther = a[0].toLowerCase() === "other";
                const bIsOther = b[0].toLowerCase() === "other";
                if (aIsOther && !bIsOther) {
                    return 1;
                }
                if (!aIsOther && bIsOther) {
                    return -1;
                }
                return a[0].localeCompare(b[0]);
            })
            .map(([category, items]) => ({
                title: category,
                data: items.sort((itemA, itemB) =>
                    itemA[1].name.localeCompare(itemB[1].name)
                ),
            }));

        const sortedCategories = sectionEntries.map((section) => section.title);
        const filteredItems = sectionEntries
            .filter(
                (section) =>
                    activeCategory === null || section.title === activeCategory
            )
            .flatMap((section) => section.data)
            .sort((itemA, itemB) => itemA[1].name.localeCompare(itemB[1].name));
        const totalItems = filteredItems.length;

        let previewItemCount = 0;
        if (totalItems === 0) {
            previewItemCount = 1;
        } else {
            previewItemCount = Math.min(totalItems, MAX_VISIBLE_ITEMS);
        }
        const height =
            previewItemCount * ITEM_HEIGHT +
            Math.max(0, previewItemCount - 1) * ITEM_SPACING +
            LIST_VERTICAL_PADDING;

        const minHeight =
            MIN_LIST_ITEMS * ITEM_HEIGHT +
            Math.max(0, MIN_LIST_ITEMS - 1) * ITEM_SPACING +
            LIST_VERTICAL_PADDING;

        return {
            items: filteredItems,
            listHeight: height,
            minListHeight: minHeight,
            categories: sortedCategories,
        };
    }, [exerciseDefs, activeCategory]);

    useEffect(() => {
        if (!props.isVisible) {
            setSelectedExerciseIds([]);
            setEditingExerciseDef(null);
            setIsNewModalVisible(false);
            setIsMergeModalVisible(false);
        }
    }, [props.isVisible]);

    useEffect(() => {
        if (activeCategory !== null && !categories.includes(activeCategory)) {
            setActiveCategory(null);
        }
    }, [activeCategory, categories]);

    const toggleSelection = (exerciseId: string) => {
        setSelectedExerciseIds((current) => {
            if (current.includes(exerciseId)) {
                return current.filter((id) => id !== exerciseId);
            }
            return [...current, exerciseId];
        });
    };

    const onAddSelected = () => {
        if (!selectedExerciseIds.length) {
            return;
        }
        selectedExerciseIds.forEach((id) => props.onAddExercise(id));
        props.onClose();
        setSelectedExerciseIds([]);
    };

    const onMergeSelected = () => {
        if (selectedExerciseIds.length < 2) {
            return;
        }
        setIsMergeModalVisible(true);
    };

    const canMerge = selectedExerciseIds.length >= 2;

    const onOpenActions = (exerciseDefId: string) => {
        const exercise = exerciseDefs[exerciseDefId];
        if (!exercise) {
            return;
        }

        suppressPressRef.current = true;
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ["Edit", "Delete", "Cancel"],
                cancelButtonIndex: 2,
                destructiveButtonIndex: 1,
            },
            (buttonIndex) => {
                if (buttonIndex === 0) {
                    setEditingExerciseDef(exerciseDefId);
                } else if (buttonIndex === 1) {
                    withWarning(
                        () => {
                            props.onDeleteExerciseDef(exerciseDefId);
                            Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Medium
                            );
                        },
                        {
                            title: `Delete ${exercise.name}`,
                            message:
                                "Existing exercises will be marked as unknown",
                        }
                    );
                }
                suppressPressRef.current = false;
            }
        );
    };

    const headerAction = (
        <View style={styles.headerActions}>
            {canMerge && (
                <TouchableOpacity
                    style={styles.mergeButton}
                    onPress={onMergeSelected}
                    accessibilityRole="button"
                >
                    <Ionicons
                        name="git-merge"
                        color="white"
                        size={18}
                        style={styles.mergeIcon}
                    />
                </TouchableOpacity>
            )}
            <TouchableOpacity
                style={styles.newButton}
                onPress={() => setIsNewModalVisible(true)}
                accessibilityRole="button"
            >
                <Ionicons name="add" color="white" size={20} />
            </TouchableOpacity>
        </View>
    );

    return (
        <ModalDialog
            title="Add Exercise"
            isVisible={props.isVisible}
            onClose={props.onClose}
            headerAction={headerAction}
            headerSpacing={0}
        >
            <View style={styles.filterRow}>
                {categories.map((category) => {
                    const isActive = category === activeCategory;
                    return (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.filterPill,
                                isActive && styles.filterPillActive,
                            ]}
                            onPress={() =>
                                setActiveCategory(isActive ? null : category)
                            }
                            accessibilityRole="button"
                            accessibilityState={{ selected: isActive }}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    isActive && styles.filterTextActive,
                                ]}
                            >
                                {category}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <View
                style={[
                    styles.listContainer,
                    {
                        maxHeight: Math.max(listHeight, minListHeight),
                        height: Math.max(listHeight, minListHeight),
                        minHeight: minListHeight,
                    },
                ]}
            >
                <FlatList
                    data={items}
                    keyExtractor={(item) => item[0]}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.exerciseItem,
                                selectedExerciseIds.includes(item[0]) &&
                                    styles.exerciseItemSelected,
                            ]}
                            onPress={() => {
                                if (suppressPressRef.current) {
                                    suppressPressRef.current = false;
                                    return;
                                }
                                toggleSelection(item[0]);
                            }}
                            onLongPress={() => onOpenActions(item[0])}
                        >
                            <Text style={styles.exerciseText}>
                                {item[1].name}
                            </Text>
                            <Ionicons
                                name={
                                    selectedExerciseIds.includes(item[0])
                                        ? "add-circle"
                                        : "add-outline"
                                }
                                color={
                                    selectedExerciseIds.includes(item[0])
                                        ? "#58A5F9"
                                        : "rgba(255, 255, 255, 0.65)"
                                }
                                size={18}
                            />
                        </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                />
            </View>
            <TouchableOpacity
                style={[
                    styles.addSelectedButton,
                    !selectedExerciseIds.length &&
                        styles.addSelectedButtonDisabled,
                ]}
                onPress={onAddSelected}
                disabled={!selectedExerciseIds.length}
            >
                <Text style={styles.addSelectedButtonText}>Add</Text>
            </TouchableOpacity>
            <EditExerciseModal
                isVisible={editingExerciseDef !== null}
                exerciseId={editingExerciseDef}
                exercise={
                    editingExerciseDef
                        ? exerciseDefs[editingExerciseDef] ?? null
                        : null
                }
                onSave={async (exerciseId, name, category) => {
                    await props.onUpdateExerciseDef(exerciseId, {
                        name,
                        category,
                    });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setEditingExerciseDef(null);
                    suppressPressRef.current = false;
                }}
                onClose={() => {
                    setEditingExerciseDef(null);
                    suppressPressRef.current = false;
                }}
            />
            <NewExerciseModal
                isVisible={isNewModalVisible}
                onCreate={async (name, category) => {
                    await props.onCreateExerciseDef(name, category);
                    setIsNewModalVisible(false);
                }}
                onClose={() => setIsNewModalVisible(false)}
            />
            <MergeExerciseModal
                isVisible={isMergeModalVisible}
                selectedExerciseIds={selectedExerciseIds}
                exerciseDefs={exerciseDefs}
                onMerge={async (targetExerciseId, sourceExerciseIds) => {
                    await props.onMergeExerciseDefs(
                        targetExerciseId,
                        sourceExerciseIds
                    );
                    setIsMergeModalVisible(false);
                    setSelectedExerciseIds([targetExerciseId]);
                }}
                onClose={() => setIsMergeModalVisible(false)}
            />
        </ModalDialog>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        flexGrow: 1,
        flexShrink: 1,
        width: "100%",
        minHeight: 0,
        paddingTop: 4,
    },
    list: {
        flexGrow: 1,
        flexShrink: 1,
    },
    listContent: {
        paddingBottom: 12,
    },
    exerciseItem: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        marginBottom: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    exerciseItemSelected: {
        backgroundColor: "rgba(88, 165, 249, 0.2)",
        borderColor: "rgba(88, 165, 249, 0.5)",
    },
    exerciseText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    newButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#58A5F9",
        alignItems: "center",
        justifyContent: "center",
    },
    mergeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#58A5F9",
        alignItems: "center",
        justifyContent: "center",
    },
    mergeIcon: {
        marginLeft: 2,
    },
    mergeButtonDisabled: {
        opacity: 0.4,
    },
    addSelectedButton: {
        width: "100%",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
        backgroundColor: "#58A5F9",
        marginTop: 8,
    },
    addSelectedButtonDisabled: {
        opacity: 0.5,
    },
    addSelectedButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 16,
    },
    filterRow: {
        marginTop: -6,
        paddingTop: 2,
        paddingBottom: 4,
        paddingHorizontal: 2,
        gap: 6,
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 4,
    },
    filterPill: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
    },
    filterPillActive: {
        backgroundColor: "rgba(88, 165, 249, 0.25)",
        borderColor: "rgba(88, 165, 249, 0.7)",
    },
    filterText: {
        color: "rgba(255, 255, 255, 0.75)",
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    filterTextActive: {
        color: "white",
    },
});

export default ExerciseListModal;
