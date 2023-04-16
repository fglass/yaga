import { useState, useEffect } from "react";
import { StyleProp, Text, ViewStyle } from "react-native";
import { formatTime } from "../util";

interface Props {
    style?: StyleProp<ViewStyle>;
}

export default (props: Props) => {
    const [time, setTime] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTime(time + 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [time]);

    return <Text style={props.style}>{formatTime(time)}</Text>;
};
