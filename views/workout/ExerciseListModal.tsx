import React, { useMemo, useState, useEffect } from "react";
import {
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExerciseDefs } from "../../model/database";
import ModalDialog from "../../components/ModalDialog";
import type { ExerciseDef } from "../../model/types";

interface Props {
    isVisible: boolean;
    onSelect: (exerciseId: string) => void;
    onNew: () => void;
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

    const { items, listHeight, minListHeight, categories } = useMemo(() => {
        const grouped: Record<string, ExerciseItem[]> = {};
        Object.entries(exerciseDefs).forEach(([id, def]) => {
            const category = def.category?.trim().length
                ? def.category.trim()
                : "Other";
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push([id, def]);
        });

        const sectionEntries = Object.entries(grouped)
            .sort((a, b) => a[0].localeCompare(b[0]))
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
        if (activeCategory !== null && !categories.includes(activeCategory)) {
            setActiveCategory(null);
        }
    }, [activeCategory, categories]);

    const headerAction = (
        <TouchableOpacity
            style={styles.newButton}
            onPress={props.onNew}
            accessibilityRole="button"
        >
            <Ionicons name="add" color="white" size={20} />
        </TouchableOpacity>
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
                            style={styles.exerciseItem}
                            onPress={() => {
                                props.onSelect(item[0]);
                                props.onClose();
                            }}
                        >
                            <Text style={styles.exerciseText}>
                                {item[1].name}
                            </Text>
                            <Ionicons
                                name="add-outline"
                                color="rgba(255, 255, 255, 0.65)"
                                size={18}
                            />
                        </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                />
            </View>
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
    exerciseText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },
    newButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#58A5F9",
        alignItems: "center",
        justifyContent: "center",
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
