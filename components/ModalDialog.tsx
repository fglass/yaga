import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    DimensionValue,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    title: string;
    isVisible: boolean;
    children: React.ReactNode;
    onClose: () => void;
    maxHeight?: DimensionValue;
    headerAction?: React.ReactNode;
    headerSpacing?: number;
}

const ModalDialog = ({
    title,
    isVisible,
    children,
    onClose,
    maxHeight,
    headerAction,
    headerSpacing,
}: Props) => (
    <Modal
        visible={isVisible}
        onRequestClose={onClose}
        transparent
        animationType="fade"
    >
        <View style={styles.container}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View
                style={[
                    styles.modal,
                    maxHeight != null ? { maxHeight } : undefined,
                ]}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.headerButtons}>
                        {headerAction}
                        <Pressable
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons name="close" color="white" size={18} />
                        </Pressable>
                    </View>
                </View>
                <View
                    style={[
                        styles.divider,
                        headerSpacing !== undefined
                            ? { marginTop: headerSpacing }
                            : null,
                    ]}
                />
                <View style={styles.content}>{children}</View>
            </View>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(42, 49, 53, 0.9)",
    },
    modal: {
        width: "100%",
        maxWidth: 420,
        maxHeight: "80%",
        backgroundColor: "#353C42",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        padding: 22,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 12,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "white",
        flex: 1,
        marginRight: 12,
    },
    headerButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        marginBottom: 12,
    },
    content: {
        width: "100%",
        minHeight: 0,
        flexShrink: 1,
    },
});

export default ModalDialog;
