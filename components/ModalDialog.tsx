import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
    title: string;
    isVisible: boolean;
    children: React.ReactNode;
    onClose: () => void;
}

const ModalDialog = ({ title, isVisible, children, onClose }: Props) => (
    <Modal visible={isVisible} onRequestClose={onClose} transparent>
        <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
        >
            <View style={styles.container}>
                <View
                    style={styles.modal}
                    onStartShouldSetResponder={() => true}
                    onTouchEnd={(e) => e.stopPropagation()}
                >
                    <Text style={styles.title}>{title}</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Ionicons name="ios-close" color="white" size={24} />
                    </TouchableOpacity>
                    {children}
                </View>
            </View>
        </TouchableOpacity>
    </Modal>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modal: {
        maxHeight: "40%",
        backgroundColor: "#2A3135",
        borderRadius: 10,
        padding: 20,
        width: "80%",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#58A5F9",
        marginBottom: 5,
    },
    closeButton: {
        position: "absolute",
        top: 5,
        right: 5,
    },
});

export default ModalDialog;
