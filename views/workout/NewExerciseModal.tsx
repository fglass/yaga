import React, { useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import ModalDialog from "../../components/ModalDialog";
import Button from "../../components/Button";

interface Props {
    isVisible: boolean;
    onClose: () => void;
    onCreate: (name: string, category: string) => void;
}

export default (props: Props) => {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    return (
        <ModalDialog
            title="New Exercise"
            isVisible={props.isVisible}
            onClose={props.onClose}
        >
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Name"
            />
            <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="Category"
            />
            <Button
                label="Add"
                colour="info"
                onPress={() => props.onCreate(name, category)}
                disabled={name === "" || category === ""}
                style={{ marginTop: 20 }}
            />
        </ModalDialog>
    );
};

const styles = StyleSheet.create({
    input: {
        marginHorizontal: 10,
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: "white",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderColor: "rgba(255, 255, 255, 0.3)",
        borderWidth: 1,
        borderRadius: 8,
    },
});
