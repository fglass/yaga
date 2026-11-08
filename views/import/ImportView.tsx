import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { useImportViewModel } from "./import.viewModel";

const ImportView = ({
    fileUri,
    onClose,
}: {
    fileUri: string | null;
    onClose: () => void;
}) => {
    const vm = useImportViewModel(fileUri, onClose);
    return (
        <Modal transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.dialog}>
                    <ActivityIndicator color="white" />
                    <Text style={styles.text}>
                        {vm.isImporting
                            ? "Importing Strong CSV…"
                            : "Preparing import…"}
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    dialog: {
        padding: 28,
        borderRadius: 16,
        backgroundColor: "#2A3135",
        gap: 16,
    },
    text: { color: "white", fontSize: 17 },
});

export default ImportView;
