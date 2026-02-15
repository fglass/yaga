import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    StyleSheet,
    TextInput,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ModalDialog from "../../components/ModalDialog";
import CategoryDropdown from "../../components/CategoryDropdown";
import type { ExerciseCategory, ExerciseDef } from "../../model/types";

interface Props {
    isVisible: boolean;
    exerciseId: string | null;
    exercise: ExerciseDef | null;
    onSave: (exerciseId: string, name: string, category: ExerciseCategory) => void;
    onClose: () => void;
}

const EditExerciseModal = (props: Props) => {
    const [name, setName] = useState("");
    const [category, setCategory] = useState<ExerciseCategory | "">("");
    const canSubmit = name.trim() !== "" && category !== "";

    useEffect(() => {
        if (props.isVisible && props.exercise) {
            setName(props.exercise.name);
            setCategory(props.exercise.category);
        }
    }, [props.isVisible, props.exercise]);

    const onSubmit = () => {
        if (!canSubmit || !props.exerciseId) {
            return;
        }
        props.onSave(props.exerciseId, name.trim(), category as ExerciseCategory);
    };

    return (
        <ModalDialog
            title="Edit Exercise"
            isVisible={props.isVisible}
            onClose={props.onClose}
            maxHeight="50%"
        >
            <KeyboardAvoidingView
                behavior="padding"
                style={styles.keyboard}
                keyboardVerticalOffset={24}
            >
                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Name"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        returnKeyType="next"
                    />
                    <CategoryDropdown
                        value={category}
                        onChange={setCategory}
                        containerStyle={styles.dropdownWrapper}
                    />
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            !canSubmit && styles.submitButtonDisabled,
                        ]}
                        onPress={onSubmit}
                        disabled={!canSubmit}
                    >
                        <Text style={styles.submitButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ModalDialog>
    );
};

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
        marginBottom: 8,
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

export default EditExerciseModal;
