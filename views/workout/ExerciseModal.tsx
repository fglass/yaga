import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
} from "react-native";
import { exerciseDefs } from "../../model";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
    isVisible: boolean;
    onClose: () => void;
    onSelect: (exerciseId: string) => void;
}

export default (props: Props) => {
    return (
        <Modal
            visible={props.isVisible}
            onRequestClose={props.onClose}
            transparent
        >
            <View style={styles.container}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Add Exercise</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={props.onClose}
                    >
                        <Ionicons name="ios-close" color="white" size={24} />
                    </TouchableOpacity>
                    <FlatList
                        data={Object.entries(exerciseDefs)}
                        keyExtractor={(item) => item[0]}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.exerciseItem}
                                onPress={() => {
                                    props.onClose();
                                    props.onSelect(item[0]);
                                }}
                            >
                                <Text style={styles.exerciseText}>
                                    {item[1].name}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modal: {
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
    exerciseItem: {
        padding: 10,
        borderBottomColor: "white",
        borderBottomWidth: 1,
    },
    exerciseText: {
        color: "white",
    },
});
