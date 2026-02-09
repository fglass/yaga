import { CompletedWorkout } from "../../model/types";

const FAKE_STRAVA_ACTIVITY_ID = "0000000000000000000";

export const getStravaActivityId = (
    workout: CompletedWorkout
): string | null => {
    const raw = workout.metadata?.stravaActivityId;
    if (typeof raw !== "string") {
        return null;
    }

    const normalized = raw.trim();

    if (normalized === FAKE_STRAVA_ACTIVITY_ID) {
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

    if (hasFakeStravaActivityId(workout)) {
        return false;
    }

    if (getStravaActivityId(workout) != null) {
        return true;
    }

    if (isAppleHealthImportedWorkout(workout)) {
        return false;
    }

    // Allow Strava retry
    return options?.isStravaLoggingEnabled ?? true;
};

const hasFakeStravaActivityId = (workout: CompletedWorkout): boolean =>
    typeof workout.metadata?.stravaActivityId === "string" &&
    workout.metadata.stravaActivityId.trim() === FAKE_STRAVA_ACTIVITY_ID;

const isAppleHealthImportedWorkout = (workout: CompletedWorkout): boolean =>
    workout.metadata?.importedBy === "apple-health";
