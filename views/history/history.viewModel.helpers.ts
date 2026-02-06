import { CompletedWorkout } from "../../model/types";

export const getStravaActivityId = (
    workout: CompletedWorkout
): string | null => {
    const raw = workout.metadata?.stravaActivityId;
    if (typeof raw !== "string") {
        return null;
    }

    const normalized = raw.trim();
    if (!/^[1-9]\d*$/.test(normalized)) {
        return null;
    }

    return normalized;
};

export const isLocalWorkoutSelectable = (workout: CompletedWorkout): boolean =>
    workout.type === "strength" || getStravaActivityId(workout) != null;
