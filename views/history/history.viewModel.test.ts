import { CompletedWorkout } from "../../model/types";
import {
    getStravaActivityId,
    getWorkoutTemplateId,
    isLocalWorkoutSelectable,
    matchesWorkoutTemplateId,
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

    it("treats run workouts with fake strava ID as not selectable", () => {
        const workout = workoutFactory({
            type: "run",
            metadata: { stravaActivityId: "0000000000000000000" },
        });

        expect(
            isLocalWorkoutSelectable(workout, {
                isStravaLoggingEnabled: true,
            })
        ).toBe(false);
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

    it("gets null when strava activity ID is fake backfill ID", () => {
        const workout = workoutFactory({
            metadata: { stravaActivityId: "0000000000000000000" },
        });

        expect(getStravaActivityId(workout)).toBeNull();
    });

    it("gets template ID from workout metadata", () => {
        const workout = workoutFactory({
            metadata: { templateId: "template-123" },
        });

        expect(getWorkoutTemplateId(workout)).toBe("template-123");
    });

    it("gets null when template ID is missing or blank", () => {
        expect(getWorkoutTemplateId(workoutFactory({ metadata: {} }))).toBeNull();
        expect(
            getWorkoutTemplateId(
                workoutFactory({
                    metadata: { templateId: "   " },
                })
            )
        ).toBeNull();
    });

    it("matches workout template IDs using trimmed values", () => {
        const workout = workoutFactory({
            metadata: { templateId: " template-123 " },
        });

        expect(matchesWorkoutTemplateId(workout, "template-123")).toBe(true);
        expect(matchesWorkoutTemplateId(workout, " template-123 ")).toBe(true);
        expect(matchesWorkoutTemplateId(workout, "template-456")).toBe(false);
    });
});
