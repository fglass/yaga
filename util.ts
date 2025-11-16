import { Alert, Share, NativeModules } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

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
    await Share.share({ message: text });
};

export const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
};

export const parseWorkoutEnd = (timestamp?: number | null): Date | null => {
    if (typeof timestamp !== "number") {
        return null;
    }

    const parsedDate = new Date(timestamp);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
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

const isExpoDevLauncherAvailable =
    NativeModules != null &&
    (NativeModules as Record<string, unknown>).EXDevLauncher !== undefined;

export const isUsingExpoDevClient = (): boolean => {
    return (
        isExpoDevLauncherAvailable ||
        (__DEV__ &&
            Constants.executionEnvironment === ExecutionEnvironment.Bare)
    );
};
