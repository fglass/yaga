import React, { useMemo } from "react";
import {
    Text,
    StyleSheet,
    TouchableOpacity,
    SectionList,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExerciseDefs } from "../../model/database";
import ModalDialog from "../../components/ModalDialog";

interface Props {
    isVisible: boolean;
    onSelect: (exerciseId: string) => void;
    onNew: () => void;
    onClose: () => void;
}

type ExerciseItem = [string, { name: string; category: string }];
const MAX_VISIBLE_ITEMS = 5;
const ITEM_HEIGHT = 44;
const ITEM_SPACING = 10;
const SECTION_HEADER_HEIGHT = 24;
const LIST_VERTICAL_PADDING = 0;

const ExerciseListModal = (props: Props) => {
    const exerciseDefs = useExerciseDefs();
    const { sections, listHeight } = useMemo(() => {
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

        const totalItems = sectionEntries.reduce(
            (count, section) => count + section.data.length,
            0
        );

        let previewItemCount = 0;
        let previewHeaderCount = 0;
        if (totalItems === 0) {
            previewItemCount = 1;
        } else {
            for (const section of sectionEntries) {
                if (previewItemCount >= MAX_VISIBLE_ITEMS) {
                    break;
                }
                const remaining = MAX_VISIBLE_ITEMS - previewItemCount;
                const take = Math.min(section.data.length, remaining);
                if (take > 0) {
                    previewHeaderCount += 1;
                    previewItemCount += take;
                }
            }
        }
        const height =
            previewItemCount * ITEM_HEIGHT +
            Math.max(0, previewItemCount - 1) * ITEM_SPACING +
            previewHeaderCount * SECTION_HEADER_HEIGHT +
            LIST_VERTICAL_PADDING;

        return { sections: sectionEntries, listHeight: height };
    }, [exerciseDefs]);

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
            <View
                style={[
                    styles.listContainer,
                    { maxHeight: listHeight, height: listHeight },
                ]}
            >
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item[0]}
                    renderSectionHeader={({ section }) => (
                        <Text style={styles.sectionHeader}>
                            {section.title}
                        </Text>
                    )}
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
                    stickySectionHeadersEnabled={false}
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
    },
    list: {
        flexGrow: 1,
        flexShrink: 1,
    },
    listContent: {
        paddingBottom: 8,
    },
    sectionHeader: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        marginTop: 6,
        marginBottom: 2,
        paddingHorizontal: 0,
        letterSpacing: 0.6,
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
});

export default ExerciseListModal;
