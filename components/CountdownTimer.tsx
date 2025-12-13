import React from "react";
import {
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";
import { formatTime } from "../util";

interface Props {
    containerStyle?: StyleProp<ViewStyle>;
    barStyle?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    remainingTime: number;
    totalTime: number;
}

const CountdownTimer = ({
    containerStyle,
    barStyle,
    labelStyle,
    remainingTime,
    totalTime,
}: Props) => {
    if (remainingTime < 0) {
        return null;
    }

    const progress = Math.max(
        0,
        Math.min(1, remainingTime / Math.max(1, totalTime))
    );

    return (
        <View style={[styles.container, containerStyle]}>
            <View style={styles.track}>
                <View
                    style={[
                        styles.fill,
                        barStyle,
                        { width: `${progress * 100}%` },
                    ]}
                />
                <Text style={[styles.label, labelStyle]}>
                    {formatTime(remainingTime)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    track: {
        height: 32,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        justifyContent: "center",
    },
    fill: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        borderRadius: 8,
        backgroundColor: "rgba(77, 166, 255, 0.65)",
    },
    label: {
        textAlign: "center",
        color: "white",
        fontWeight: "700",
        letterSpacing: 0.2,
    },
});

export default CountdownTimer;
