import { fetchAppleHealthWorkouts } from "./health";
import {
    queryWorkoutSamples,
    WorkoutActivityType,
} from "@kingstinct/react-native-healthkit";

type MockWorkoutProxy = {
    toJSON: () => {
        uuid: string;
        workoutActivityType: number;
        startDate: string;
        endDate: string;
        duration?: { quantity?: number };
    };
    getStatistic: jest.Mock;
};

const mockWorkoutSamples = (
    samples: Array<{
        uuid: string;
        workoutActivityType: number;
        startDate: string;
        endDate: string;
        duration?: { quantity?: number };
        distance?: number;
    }>
): MockWorkoutProxy[] => {
    const proxies = samples.map<MockWorkoutProxy>((sample) => ({
        toJSON: () => sample,
        getStatistic: jest.fn().mockResolvedValue(
            sample.distance == null
                ? undefined
                : { sumQuantity: { quantity: sample.distance } }
        ),
    }));

    (queryWorkoutSamples as jest.Mock).mockResolvedValue(proxies);

    return proxies;
};

jest.mock("@kingstinct/react-native-healthkit", () => {
    const mockWorkoutActivityType = {
        running: 37,
        traditionalStrengthTraining: 50,
        cycling: 16,
    };

    return {
        isHealthDataAvailableAsync: jest.fn(),
        queryWorkoutSamples: jest.fn(),
        requestAuthorization: jest.fn(),
        saveWorkoutSample: jest.fn(),
        WorkoutActivityType: mockWorkoutActivityType,
        WorkoutTypeIdentifier: "WorkoutTypeIdentifier",
    };
});

describe("fetchAppleHealthWorkouts", () => {
    it("keeps supported workouts when unsupported types are present", async () => {
        const runningSample = {
            uuid: "run-1",
            workoutActivityType: WorkoutActivityType.running,
            startDate: "2024-01-02T10:00:00.000Z",
            endDate: "2024-01-02T11:00:00.000Z",
            duration: { quantity: 3600 },
        };
        const unsupportedSample = {
            uuid: "cycle-1",
            workoutActivityType: WorkoutActivityType.cycling,
            startDate: "2024-01-03T10:00:00.000Z",
            endDate: "2024-01-03T11:00:00.000Z",
            duration: { quantity: 3600 },
        };

        mockWorkoutSamples([
            { ...runningSample, distance: 5 },
            { ...unsupportedSample },
        ]);

        const workouts = await fetchAppleHealthWorkouts();

        expect(workouts).toHaveLength(1);
        expect(workouts[0]).toMatchObject({
            id: "run-1",
            workoutType: "run",
            distance: 5,
        });
    });

    it("dedupes workouts with matching start times and durations", async () => {
        const startDate = "2024-02-01T10:00:00.000Z";
        const endDate = "2024-02-01T11:00:00.000Z";
        const baseSample = {
            workoutActivityType: WorkoutActivityType.running,
            startDate,
            endDate,
            duration: { quantity: 3600 },
        };

        mockWorkoutSamples([
            { ...baseSample, uuid: "run-1", distance: 5 },
            { ...baseSample, uuid: "run-2", distance: 6 },
        ]);

        const workouts = await fetchAppleHealthWorkouts();

        expect(workouts).toHaveLength(1);
        expect(workouts[0]).toMatchObject({
            workoutType: "run",
            distance: 5,
        });
    });
});
