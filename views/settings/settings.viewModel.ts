import React from "react";
import * as DocumentPicker from "expo-document-picker";
import Constants from "expo-constants";
import {
    exportDatabase,
    importDatabase,
    resetDatabase,
} from "../../model/database";
import {
    getHealthLoggingEnabled,
    setHealthLoggingEnabled,
} from "../../model/health";
import {
    getStravaLoggingEnabled,
    setStravaLoggingEnabled,
    getAccessToken,
} from "../../model/strava";

export const useSettingsViewModel = () => {
    const [isHealthLoggingEnabled, setHealthLoggingEnabledState] =
        React.useState(getHealthLoggingEnabled());
    const [isStravaLoggingEnabled, setStravaLoggingEnabledState] =
        React.useState(getStravaLoggingEnabled());
    const [isImportVisible, setImportVisible] = React.useState(false);
    const [importFileUri, setImportFileUri] = React.useState<string | null>(
        null
    );
    const [importFileName, setImportFileName] = React.useState<string | null>(
        null
    );

    const isDevBuild = process.env.EXPO_PUBLIC_APP_VARIANT === "development";
    const gitCommit = Constants.expoConfig?.extra?.gitCommit ?? "unknown";

    const toggleHealthLogging = () => {
        const next = !isHealthLoggingEnabled;
        setHealthLoggingEnabledState(next);
        setHealthLoggingEnabled(next);
    };

    const toggleStravaLogging = () => {
        const next = !isStravaLoggingEnabled;
        setStravaLoggingEnabledState(next);
        setStravaLoggingEnabled(next);
    };

    const authStrava = async () => {
        const token = await getAccessToken();
        alert(token ? "Strava auth successful" : "Strava auth failed");
    };

    const openImportFromStrong = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            type: "*/*",
        });

        if (result.canceled) {
            return;
        }

        const file = result.assets?.[0];
        if (!file?.uri) {
            return;
        }

        setImportFileUri(file.uri);
        setImportFileName(file.name ?? null);
        setImportVisible(true);
    };

    const closeImportFromStrong = () => {
        setImportVisible(false);
        setImportFileUri(null);
        setImportFileName(null);
    };

    return {
        isDevBuild,
        gitCommit,
        isHealthLoggingEnabled,
        isStravaLoggingEnabled,
        toggleHealthLogging,
        toggleStravaLogging,
        authStrava,
        openImportFromStrong,
        exportDatabase,
        importDatabase,
        resetDatabase,
        isImportVisible,
        importFileUri,
        importFileName,
        closeImportFromStrong,
    };
};
