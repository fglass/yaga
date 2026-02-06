import { CompletedWorkout } from "../../model/types";

export const getStravaActivityId = (
    workout: CompletedWorkout
): string | null => {
    const raw = workout.metadata?.stravaActivityId;
    if (typeof raw !== "string") {
        return null;
    }

    const normalized = raw.trim();
    if (!/^\d+$/.test(normalized)) {
        return null;
    }

    return normalized;
};

export const isLocalWorkoutSelectable = (
    workout: CompletedWorkout,
    options?: { isStravaLoggingEnabled?: boolean }
): boolean => {
    if (workout.type === "strength") {
        return true;
    }

    if (workout.type !== "run") {
        return false;
    }

    if (getStravaActivityId(workout) != null) {
        return true;
    }

    if (isAppleHealthImportedWorkout(workout)) {
        return false;
    }

    return options?.isStravaLoggingEnabled ?? true;
};

const isAppleHealthImportedWorkout = (workout: CompletedWorkout): boolean =>
    workout.metadata?.importedBy === "apple-health";
