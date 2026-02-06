import { CompletedWorkout } from "../../model/types";
import {
    getStravaActivityId,
    isLocalWorkoutSelectable,
} from "./history.viewModel.helpers";

const workoutFactory = (
    overrides: Partial<CompletedWorkout> = {}
): CompletedWorkout => ({
    id: "workout-id",
    name: "Workout",
    notes: "",
    type: "run",
    exercises: [],
    metadata: {},
    startTimestamp: 1,
    endTimestamp: 2,
    ...overrides,
});

describe("history.viewModel.helpers", () => {
    it("treats strength workouts as selectable", () => {
        const workout = workoutFactory({
            type: "strength",
            metadata: {},
        });

        expect(isLocalWorkoutSelectable(workout)).toBe(true);
    });

    it("treats run workouts with strava ID as selectable", () => {
        const workout = workoutFactory({
            type: "run",
            metadata: { stravaActivityId: "999" },
        });

        expect(isLocalWorkoutSelectable(workout)).toBe(true);
    });

    it("treats run workouts without strava ID as selectable", () => {
        const workout = workoutFactory({
            type: "run",
            metadata: {},
        });

        expect(
            isLocalWorkoutSelectable(workout, {
                isStravaLoggingEnabled: true,
            })
        ).toBe(true);
    });

    it("treats run workouts without strava ID as not selectable when strava logging is disabled", () => {
        const workout = workoutFactory({
            type: "run",
            metadata: {},
        });

        expect(
            isLocalWorkoutSelectable(workout, {
                isStravaLoggingEnabled: false,
            })
        ).toBe(false);
    });

    it("treats Apple Health imported runs as not selectable", () => {
        const workout = workoutFactory({
            type: "run",
            metadata: { importedBy: "apple-health" },
        });

        expect(
            isLocalWorkoutSelectable(workout, {
                isStravaLoggingEnabled: true,
            })
        ).toBe(false);
    });

    it("gets strava activity ID from workout metadata", () => {
        const workout = workoutFactory({
            metadata: { stravaActivityId: "123456789" },
        });

        expect(getStravaActivityId(workout)).toBe("123456789");
    });

    it("gets null when strava activity ID is absent", () => {
        const workout = workoutFactory({
            metadata: { importedBy: "app@2026-01-01T00:00:00.000Z" },
        });

        expect(getStravaActivityId(workout)).toBeNull();
    });
});
