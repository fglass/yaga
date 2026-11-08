import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { File } from "expo-file-system";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { importWorkouts } from "../../model/import/importWorkouts";
import { createImportViewModelCore } from "./import.viewModel.core";

export const useImportViewModel = (
    fileUri: string | null,
    onClose: () => void
) => {
    const queryClient = useQueryClient();
    const [isImporting, setImporting] = useState(false);
    const core = useMemo(
        () =>
            createImportViewModelCore({
                deps: {
                    readFileText: (uri) => new File(uri).text(),
                    importWorkouts,
                    alert: Alert.alert,
                    refreshDatabase: () => queryClient.invalidateQueries(),
                    onSuccess: () => {
                        void Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Success
                        );
                    },
                },
                onClose,
                setImporting,
            }),
        [onClose, queryClient]
    );
    useEffect(() => {
        if (fileUri) void core.loadCsv(fileUri);
    }, [core, fileUri]);
    return { isImporting };
};
