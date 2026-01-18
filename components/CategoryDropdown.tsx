import React, { useEffect, useState } from "react";
import {
    Keyboard,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExerciseCategory, EXERCISE_CATEGORIES } from "../model/types";

interface Props {
    value: ExerciseCategory | "";
    onChange: (value: ExerciseCategory) => void;
    options?: readonly ExerciseCategory[];
    placeholder?: string;
    containerStyle?: StyleProp<ViewStyle>;
}

const DROPDOWN_VISIBLE_ITEMS = 3;
const DROPDOWN_ITEM_HEIGHT = 40;
const DROPDOWN_BUTTON_HEIGHT = 44;
const DROPDOWN_MENU_OFFSET = 6;
const FADE_STEP_HEIGHT = 4;

const CategoryDropdown = ({
    value,
    onChange,
    options = EXERCISE_CATEGORIES,
    placeholder = "Category",
    containerStyle,
}: Props) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            Keyboard.dismiss();
        }
    }, [isOpen]);

    return (
        <View style={[styles.dropdownWrapper, containerStyle]}>
            <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setIsOpen((open) => !open)}
                accessibilityRole="button"
            >
                <Text
                    style={[
                        styles.dropdownText,
                        !value && styles.dropdownPlaceholder,
                    ]}
                >
                    {value || placeholder}
                </Text>
                <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    color="rgba(255, 255, 255, 0.7)"
                    size={18}
                />
            </TouchableOpacity>
            {isOpen && (
                <View style={styles.dropdownMenu}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.dropdownContent}
                    >
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.dropdownItem}
                                onPress={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                accessibilityRole="button"
                            >
                                <Text style={styles.dropdownItemText}>
                                    {option}
                                </Text>
                                {value === option && (
                                    <Ionicons
                                        name="checkmark"
                                        color="white"
                                        size={16}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View style={styles.fadeTopStrong} pointerEvents="none" />
                    <View style={styles.fadeTopMedium} pointerEvents="none" />
                    <View style={styles.fadeTopLight} pointerEvents="none" />
                    <View
                        style={styles.fadeBottomStrong}
                        pointerEvents="none"
                    />
                    <View
                        style={styles.fadeBottomMedium}
                        pointerEvents="none"
                    />
                    <View style={styles.fadeBottomLight} pointerEvents="none" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    dropdownWrapper: {
        position: "relative",
        zIndex: 10,
    },
    dropdown: {
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: DROPDOWN_BUTTON_HEIGHT,
        backgroundColor: "#2A3135",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dropdownText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    dropdownPlaceholder: {
        color: "rgba(255, 255, 255, 0.5)",
        fontWeight: "500",
    },
    dropdownMenu: {
        position: "absolute",
        top: DROPDOWN_BUTTON_HEIGHT + DROPDOWN_MENU_OFFSET,
        left: 0,
        right: 0,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        borderRadius: 10,
        backgroundColor: "#262C30",
        overflow: "hidden",
        maxHeight: DROPDOWN_VISIBLE_ITEMS * DROPDOWN_ITEM_HEIGHT,
        zIndex: 20,
        elevation: 8,
    },
    dropdownContent: {
        paddingVertical: 0,
    },
    dropdownItem: {
        height: DROPDOWN_ITEM_HEIGHT,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.08)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dropdownItemText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    fadeTopStrong: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: FADE_STEP_HEIGHT,
        backgroundColor: "#262C30",
        opacity: 0.9,
    },
    fadeTopMedium: {
        position: "absolute",
        top: FADE_STEP_HEIGHT,
        left: 0,
        right: 0,
        height: FADE_STEP_HEIGHT,
        backgroundColor: "#262C30",
        opacity: 0.6,
    },
    fadeTopLight: {
        position: "absolute",
        top: FADE_STEP_HEIGHT * 2,
        left: 0,
        right: 0,
        height: FADE_STEP_HEIGHT,
        backgroundColor: "#262C30",
        opacity: 0.3,
    },
    fadeBottomStrong: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: FADE_STEP_HEIGHT,
        backgroundColor: "#262C30",
        opacity: 0.9,
    },
    fadeBottomMedium: {
        position: "absolute",
        bottom: FADE_STEP_HEIGHT,
        left: 0,
        right: 0,
        height: FADE_STEP_HEIGHT,
        backgroundColor: "#262C30",
        opacity: 0.6,
    },
    fadeBottomLight: {
        position: "absolute",
        bottom: FADE_STEP_HEIGHT * 2,
        left: 0,
        right: 0,
        height: FADE_STEP_HEIGHT,
        backgroundColor: "#262C30",
        opacity: 0.3,
    },
});

export default CategoryDropdown;
