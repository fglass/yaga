import React from "react";
import { Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useExerciseDefs } from "../../model/database";
import ModalDialog from "../../components/ModalDialog";

interface Props {
    isVisible: boolean;
    onClose: () => void;
    onSelect: (exerciseId: string) => void;
    onNew: () => void;
}

export default (props: Props) => {
    return (
        <ModalDialog
            title="Add Exercise"
            isVisible={props.isVisible}
            onClose={props.onClose}
        >
            <FlatList
                data={Object.entries(useExerciseDefs())}
                keyExtractor={(item) => item[0]}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.exerciseItem}
                        onPress={() => {
                            props.onClose();
                            props.onSelect(item[0]);
                        }}
                    >
                        <Text style={styles.exerciseText}>{item[1].name}</Text>
                    </TouchableOpacity>
                )}
            />
            <TouchableOpacity onPress={props.onNew}>
                <Text style={styles.newText}>New</Text>
            </TouchableOpacity>
        </ModalDialog>
    );
};

const styles = StyleSheet.create({
    exerciseItem: {
        padding: 10,
        borderBottomColor: "white",
        borderBottomWidth: 1,
    },
    exerciseText: {
        color: "white",
    },
    newText: {
        padding: 10,
        color: "#58A5F9",
    },
});
