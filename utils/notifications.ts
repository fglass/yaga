import * as Notifications from "expo-notifications";

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
