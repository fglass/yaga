import React, { useEffect } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { formatTime } from "../util";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    style?: StyleProp<ViewStyle>;
    remainingTime: number;
    onFinish: () => void;
}

const CountdownTimer = ({ style, remainingTime, onFinish }: Props) => {
    const isFinished = remainingTime === 0;

    // TODO: remove effect?
    useEffect(() => {
        if (isFinished) {
            onFinish();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFinished]);

    if (remainingTime <= 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Ionicons name="timer-outline" color="white" size={24} />
            <Text style={[styles.text, style]}>
                {formatTime(remainingTime)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
    },
    text: {
        marginTop: 5,
        paddingLeft: 3,
    },
});

export default CountdownTimer;
