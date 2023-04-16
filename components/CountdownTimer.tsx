import React, { useEffect, useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { formatTime } from "../util";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
    style?: StyleProp<ViewStyle>;
    durationS: number;
    resetKey: number;
    onFinish: () => void;
}

export default (props: Props) => {
    const [remainingTime, setRemainingTime] = useState(props.durationS);

    useEffect(() => setRemainingTime(props.durationS), [props.resetKey]);

    useEffect(() => {
        if (props.resetKey == 0) {
            setRemainingTime(0);
            return;
        }

        const intervalId = setInterval(() => {
            setRemainingTime(remainingTime - 1);
        }, 1000);

        if (remainingTime === 0) {
            props.onFinish();
            clearInterval(intervalId);
        }

        return () => clearInterval(intervalId);
    }, [remainingTime]);

    if (props.resetKey == 0 || remainingTime == 0) {
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
