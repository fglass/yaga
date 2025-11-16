import React, { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ModalDialog from "../../components/ModalDialog";
import type { TextInput as TextInputRef } from "react-native";

interface Props {
    isVisible: boolean;
    onCreate: (name: string, category: string) => void;
    onClose: () => void;
}

const NewExerciseModal = (props: Props) => {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const categoryInputRef = useRef<TextInputRef | null>(null);
    const canSubmit = name.trim() !== "" && category.trim() !== "";

    useEffect(() => {
        if (!props.isVisible) {
            setName("");
            setCategory("");
        }
    }, [props.isVisible]);

    const onSubmit = () => {
        if (!canSubmit) {
            return;
        }
        props.onCreate(name.trim(), category.trim());
        setName("");
        setCategory("");
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
                        onSubmitEditing={() => categoryInputRef.current?.focus()}
                    />
                    <TextInput
                        ref={categoryInputRef}
                        style={styles.input}
                        value={category}
                        onChangeText={setCategory}
                        placeholder="Category"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        returnKeyType="done"
                        onSubmitEditing={onSubmit}
                    />
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
