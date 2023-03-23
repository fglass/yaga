import { useState, useEffect } from "react";
import { StyleProp, Text, ViewStyle } from "react-native";

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

    const seconds = time % 60;
    const minutes = Math.floor(time / 60);
    const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;

    return <Text style={props.style}>{formattedTime}</Text>;
};
