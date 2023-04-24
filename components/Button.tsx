import {
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from "react-native";
import { GestureResponderEvent } from "react-native/Libraries/Types/CoreEventTypes";

type Colour = "info" | "success" | "error" | "warning";

interface Props {
    label: string;
    onPress?: (event: GestureResponderEvent) => void;
    disabled?: boolean;
    colour?: Colour;
    style?: StyleProp<ViewStyle>;
}

export default (props: Props) => {
    const buttonStyle = [styles.btn, props.style];

    if (props.colour) {
        buttonStyle.push(styles[props.colour]);
    }

    if (props.disabled) {
        buttonStyle.push({ opacity: 0.5 });
    }

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={props.onPress}
            disabled={props.disabled}
        >
            <Text style={styles.label}>{props.label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    btn: {
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 10,
        marginBottom: 15,
    },
    info: {
        backgroundColor: "#58A5F9",
    },
    success: {
        backgroundColor: "#65CA79",
    },
    error: {
        backgroundColor: "#EC6569",
    },
    warning: {
        backgroundColor: "#CEAF46",
    },
    label: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
});
