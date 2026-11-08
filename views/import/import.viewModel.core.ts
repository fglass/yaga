import type { Alert } from "react-native";
import {
    buildImportData,
    parseStrongCsv,
} from "../../model/import/importStrongCsv";
import type {
    ImportData,
    ImportSummary,
} from "../../model/import/import.types";

export interface ImportViewModelDeps {
    readFileText: (uri: string) => Promise<string>;
    importWorkouts: (data: ImportData) => Promise<ImportSummary>;
    alert: typeof Alert.alert;
    refreshDatabase: () => Promise<void>;
    onSuccess: () => void;
}

export const createImportViewModelCore = ({
    deps,
    onClose,
    setImporting,
}: {
    deps: ImportViewModelDeps;
    onClose: () => void;
    setImporting: (importing: boolean) => void;
}) => {
    let started = false;
    const loadCsv = async (uri: string) => {
        if (started) return;
        started = true;
        let data: ImportData;
        try {
            const text = await deps.readFileText(uri);
            const parsed = parseStrongCsv(text);
            if (parsed.errors.length > 0) {
                throw new Error(parsed.errors[0]);
            }
            data = buildImportData(parsed.rows);
            if (data.workoutCount === 0) {
                throw new Error("The CSV contains no workouts.");
            }
        } catch (error) {
            deps.alert(
                "Import failed",
                error instanceof Error
                    ? error.message
                    : "Could not read the selected file."
            );
            onClose();
            return;
        }

        setImporting(true);
        let result: ImportSummary;
        try {
            result = await deps.importWorkouts(data);
        } catch {
            deps.alert(
                "Import failed",
                "The import could not be completed. Your existing database has not been changed."
            );
            onClose();
            return;
        }
        deps.onSuccess();
        await deps.refreshDatabase();
        deps.alert(
            "Import Complete",
            `Workouts imported: ${result.workoutsAdded}\nExercises imported: ${result.newExerciseDefs}`,
            [{ text: "Done", onPress: onClose }]
        );
    };
    return { loadCsv };
};
