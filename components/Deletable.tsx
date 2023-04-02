import React from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";

interface Props {
    children: React.ReactNode;
    onDelete: () => void;
}

export default (props: Props) => {
    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        return (
            <RectButton style={styles.rightAction}>
                <Text style={styles.rightActionText}>Delete</Text>
            </RectButton>
        );
    };

    return (
        <Swipeable
            renderRightActions={renderRightActions}
            onSwipeableOpen={props.onDelete}
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
        padding: 10,
    },
});
