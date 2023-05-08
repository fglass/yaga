import React, { useEffect, useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { formatTime } from "../util";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
    style?: StyleProp<ViewStyle>;
    durationS: number;
    onFinish: () => void;
}

const CountdownTimer = (props: Props) => {
    const [remainingTime, setRemainingTime] = useState(props.durationS);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setRemainingTime((time) => {
                if (time === 0) {
                    clearInterval(intervalId);
                }
                return time - 1;
            });
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    // TODO: refactor?
    if (remainingTime === 0) {
        props.onFinish();
    }

    if (remainingTime <= 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Ionicons name="ios-timer-outline" color="white" size={24} />
            <Text style={[styles.text, props.style]}>
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
