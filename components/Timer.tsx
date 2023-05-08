import { useState, useEffect } from "react";
import { StyleProp, Text, ViewStyle } from "react-native";
import { formatTime } from "../util";

interface Props {
    style?: StyleProp<ViewStyle>;
}

const Timer = (props: Props) => {
    const [time, setTime] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => setTime((t) => t + 1), 1000);
        return () => clearInterval(intervalId);
    }, []);

    return <Text style={props.style}>{formatTime(time)}</Text>;
};

export default Timer;
