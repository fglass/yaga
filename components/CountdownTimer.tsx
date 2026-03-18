import React from "react";
import {
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";
import { formatTime } from "../utils/util";

interface Props {
    containerStyle?: StyleProp<ViewStyle>;
    barStyle?: StyleProp<ViewStyle>;
    overtimeBarStyle?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    remainingTime: number;
    totalTime: number;
}

const CountdownTimer = ({
    containerStyle,
    barStyle,
    overtimeBarStyle,
    labelStyle,
    remainingTime,
    totalTime,
}: Props) => {
    const isOvertime = remainingTime < 0;
    const displayTime = Math.abs(remainingTime);
    const displayLabel = formatTime(displayTime);

    const progress = isOvertime
        ? 1
        : Math.max(0, Math.min(1, remainingTime / Math.max(1, totalTime)));
    const fillStyle = isOvertime ? overtimeBarStyle : barStyle;

    return (
        <View style={[styles.container, containerStyle]}>
            <View style={styles.track}>
                <View
                    style={[
                        styles.fill,
                        fillStyle,
                        { width: `${progress * 100}%` },
                    ]}
                />
                <Text style={[styles.label, labelStyle]}>
                    {displayLabel}
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
