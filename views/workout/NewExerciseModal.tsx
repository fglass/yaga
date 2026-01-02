import React, { useEffect, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    Text,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalDialog from "../../components/ModalDialog";
import type { ExerciseCategory } from "../../model/types";

interface Props {
    isVisible: boolean;
    onCreate: (name: string, category: ExerciseCategory) => void;
    onClose: () => void;
}

const NewExerciseModal = (props: Props) => {
    const [name, setName] = useState("");
    const [category, setCategory] = useState<ExerciseCategory | "">("");
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const canSubmit = name.trim() !== "" && category !== "";

    useEffect(() => {
        if (!props.isVisible) {
            setName("");
            setCategory("");
            setIsCategoryOpen(false);
        }
    }, [props.isVisible]);

    useEffect(() => {
        if (isCategoryOpen) {
            Keyboard.dismiss();
        }
    }, [isCategoryOpen]);

    const onSubmit = () => {
        if (!canSubmit) {
            return;
        }
        props.onCreate(name.trim(), category as ExerciseCategory);
        setName("");
        setCategory("");
        setIsCategoryOpen(false);
    };

    return (
        <ModalDialog
            title="New Exercise"
            isVisible={props.isVisible}
            onClose={props.onClose}
            maxHeight="50%"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboard}
                keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
            >
                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Name"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        returnKeyType="next"
                        onSubmitEditing={() => setIsCategoryOpen(true)}
                    />
                    <View style={styles.dropdownWrapper}>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setIsCategoryOpen((open) => !open)}
                            accessibilityRole="button"
                        >
                            <Text
                                style={[
                                    styles.dropdownText,
                                    !category && styles.dropdownPlaceholder,
                                ]}
                            >
                                {category || "Category"}
                            </Text>
                            <Ionicons
                                name={
                                    isCategoryOpen
                                        ? "chevron-up"
                                        : "chevron-down"
                                }
                                color="rgba(255, 255, 255, 0.7)"
                                size={18}
                            />
                        </TouchableOpacity>
                        {isCategoryOpen && (
                            <View style={styles.dropdownMenu}>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={
                                        styles.dropdownContent
                                    }
                                >
                                    {EXERCISE_CATEGORIES.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setCategory(option);
                                                setIsCategoryOpen(false);
                                            }}
                                            accessibilityRole="button"
                                        >
                                            <Text
                                                style={
                                                    styles.dropdownItemText
                                                }
                                            >
                                                {option}
                                            </Text>
                                            {category === option && (
                                                <Ionicons
                                                    name="checkmark"
                                                    color="white"
                                                    size={16}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <View
                                    style={styles.fadeTopStrong}
                                    pointerEvents="none"
                                />
                                <View
                                    style={styles.fadeTopMedium}
                                    pointerEvents="none"
                                />
                                <View
                                    style={styles.fadeTopLight}
                                    pointerEvents="none"
                                />
                                <View
                                    style={styles.fadeBottomStrong}
                                    pointerEvents="none"
                                />
                                <View
                                    style={styles.fadeBottomMedium}
                                    pointerEvents="none"
                                />
                                <View
                                    style={styles.fadeBottomLight}
                                    pointerEvents="none"
                                />
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            !canSubmit && styles.submitButtonDisabled,
                        ]}
                        onPress={onSubmit}
                        disabled={!canSubmit}
                    >
                        <Text style={styles.submitButtonText}>Add</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ModalDialog>
    );
};

const EXERCISE_CATEGORIES: ExerciseCategory[] = [
    "Back",
    "Biceps",
    "Chest",
    "Core",
    "Legs",
    "Neck",
    "Shoulders",
    "Triceps",
];

const DROPDOWN_VISIBLE_ITEMS = 3;
const DROPDOWN_ITEM_HEIGHT = 40;
const DROPDOWN_BUTTON_HEIGHT = 44;
const DROPDOWN_MENU_OFFSET = 6;
const FADE_STEP_HEIGHT = 4;

const styles = StyleSheet.create({
    keyboard: {
        width: "100%",
    },
    form: {
        width: "100%",
    },
    input: {
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#2A3135",
        color: "white",
        marginBottom: 8,
    },
    dropdownWrapper: {
        position: "relative",
        zIndex: 10,
        marginBottom: 8,
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
    submitButton: {
        marginTop: 4,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
        backgroundColor: "#58A5F9",
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 16,
    },
});

export default NewExerciseModal;
