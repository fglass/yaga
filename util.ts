import { Alert, Share } from "react-native";

export const withWarning = (onPress: () => void) => {
    Alert.alert(
        "Warning",
        "This action cannot be undone",
        [
            {
                text: "Confirm",
                onPress: onPress,
            },
            {
                text: "Cancel",
                style: "cancel",
            },
        ],
        { cancelable: false }
    );
};

export const shareText = async (text: string) => {
    try {
        await Share.share({ message: text });
    } catch (error: any) {
        console.error(error.message);
    }
};

export const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
};

export const generateGuid = (): string => {
    const S4 = () =>
        (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    return (
        S4() +
        S4() +
        "-" +
        S4() +
        "-" +
        S4() +
        "-" +
        S4() +
        "-" +
        S4() +
        S4() +
        S4()
    );
};
