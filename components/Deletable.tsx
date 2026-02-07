import React from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";

interface Props {
    children: React.ReactNode;
    onDelete: () => void;
    rightActionRadius?: number;
}

const Deletable = (props: Props) => {
    const swipeableRef = React.useRef<Swipeable | null>(null);

    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const actionOpacity = dragX.interpolate({
            inputRange: [-48, -16, 0],
            outputRange: [1, 0, 0],
            extrapolate: "clamp",
        });

        return (
            <Animated.View
                style={[
                    styles.rightActionContainer,
                    { opacity: actionOpacity },
                ]}
            >
                <RectButton
                    style={[
                        styles.rightAction,
                        {
                            borderRadius: props.rightActionRadius ?? 10,
                        },
                    ]}
                >
                    <Text style={styles.rightActionText}>Delete</Text>
                </RectButton>
            </Animated.View>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            onSwipeableWillOpen={props.onDelete}
            onSwipeableOpen={() => {
                swipeableRef.current?.close();
            }}
        >
            {props.children}
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    rightActionContainer: {
        flex: 1,
    },
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
