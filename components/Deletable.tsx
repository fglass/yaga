import React from "react";
import { StyleSheet, Text } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";

interface Props {
    children: React.ReactNode;
    onDelete: () => void;
}

const Deletable = (props: Props) => {
    const renderRightActions = () => {
        return (
            <RectButton style={styles.rightAction}>
                <Text style={styles.rightActionText}>Delete</Text>
            </RectButton>
        );
    };

    return (
        <Swipeable
            renderRightActions={renderRightActions}
            onSwipeableWillOpen={props.onDelete}
        >
            {props.children}
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    rightAction: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        backgroundColor: "#EC6569",
    },
    rightActionText: {
        color: "white",
        paddingRight: 10,
    },
});

export default Deletable;
