import { Alert, Share, NativeModules } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Notifications from "expo-notifications";

export const withWarning = (
    onPress: () => void,
    title?: string,
    message?: string
) => {
    Alert.alert(
        title ?? "Warning",
        message ?? "This action cannot be undone",
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

export const parseWorkoutStart = (
    endTimestamp: number,
    durationSeconds: number
): Date => {
    return new Date(endTimestamp - Math.max(0, durationSeconds) * 1000);
};

export const parseWorkoutEnd = (timestamp: number): Date => {
    return new Date(timestamp);
};

export const dedupeWorkoutsByStart = <T extends { startDate: Date }>(
    workouts: T[]
): T[] => {
    const toleranceMs = 60 * 1000;

    return workouts.reduce<T[]>((acc, workout) => {
        const isDuplicate = acc.some(
            (existing) =>
                Math.abs(
                    existing.startDate.getTime() - workout.startDate.getTime()
                ) <= toleranceMs
        );

        if (!isDuplicate) {
            acc.push(workout);
        }

        return acc;
    }, []);
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

export const ensureNotificationPermission = async (): Promise<boolean> => {
    const settings = await Notifications.getPermissionsAsync();
    if (
        settings.granted ||
        settings.ios?.status ===
            Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
        return true;
    }

    const request = await Notifications.requestPermissionsAsync();
    return (
        request.granted ||
        request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
};
