import { fetchAppleHealthWorkouts, syncAppleHealthRunsToDatabase } from "./health";
import type { AppleHealthWorkout, CompletedWorkout } from "../types";
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
        sourceRevision?: { source?: { name: string; bundleIdentifier: string } };
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
        sourceRevision?: { source?: { name: string; bundleIdentifier: string } };
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
    it("keeps four lookups in flight while preserving workout order", async () => {
        const proxies = mockWorkoutSamples(
            Array.from({ length: 5 }, (_, index) => ({
                uuid: `run-${index}`,
                workoutActivityType: WorkoutActivityType.running,
                startDate: new Date(Date.UTC(2024, 0, index + 1, 10)).toISOString(),
                endDate: new Date(Date.UTC(2024, 0, index + 1, 11)).toISOString(),
            }))
        );
        const releases = proxies.map(() => createSignal());
        const firstFourStarted = createSignal();
        const fifthStarted = createSignal();
        let inFlight = 0;
        let peakInFlight = 0;

        proxies.forEach((proxy, index) => {
            proxy.getStatistic.mockImplementation(async () => {
                inFlight += 1;
                peakInFlight = Math.max(peakInFlight, inFlight);
                if (index === 3) {
                    firstFourStarted.resolve();
                }
                if (index === 4) {
                    fifthStarted.resolve();
                }
                await releases[index].promise;
                inFlight -= 1;
                return { sumQuantity: { quantity: index + 1 } };
            });
        });

        const pendingWorkouts = fetchAppleHealthWorkouts();
        await firstFourStarted.promise;
        expect(inFlight).toBe(4);

        releases[3].resolve();
        await fifthStarted.promise;
        expect(inFlight).toBe(4);

        releases.forEach((release) => release.resolve());
        const workouts = await pendingWorkouts;

        expect(peakInFlight).toBe(4);
        expect(workouts.map((workout) => workout.id)).toEqual([
            "run-0",
            "run-1",
            "run-2",
            "run-3",
            "run-4",
        ]);
        expect(workouts.map((workout) => workout.distance)).toEqual([
            1, 2, 3, 4, 5,
        ]);
    });

    it("keeps workouts when one distance lookup fails", async () => {
        const proxies = mockWorkoutSamples([
            {
                uuid: "run-failed-distance",
                workoutActivityType: WorkoutActivityType.running,
                startDate: "2024-01-01T10:00:00.000Z",
                endDate: "2024-01-01T11:00:00.000Z",
            },
            {
                uuid: "run-with-distance",
                workoutActivityType: WorkoutActivityType.running,
                startDate: "2024-01-02T10:00:00.000Z",
                endDate: "2024-01-02T11:00:00.000Z",
                distance: 5,
            },
        ]);
        proxies[0].getStatistic.mockRejectedValue(new Error("Health read failed"));

        const workouts = await fetchAppleHealthWorkouts();

        expect(workouts).toHaveLength(2);
        expect(workouts[0].id).toBe("run-failed-distance");
        expect(workouts[0].distance).toBeUndefined();
        expect(workouts[1].distance).toBe(5);
    });

    it("returns no workouts for an empty Health history", async () => {
        mockWorkoutSamples([]);

        const workouts = await fetchAppleHealthWorkouts();

        expect(workouts).toEqual([]);
    });

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

    it("skips workouts logged by Yaga", async () => {
        mockWorkoutSamples([
            {
                uuid: "run-yaga",
                workoutActivityType: WorkoutActivityType.running,
                startDate: "2024-02-10T10:00:00.000Z",
                endDate: "2024-02-10T11:00:00.000Z",
                duration: { quantity: 3600 },
                distance: 8,
                sourceRevision: {
                    source: {
                        name: "Yaga",
                        bundleIdentifier: "com.expench.yaga",
                    },
                },
            },
            {
                uuid: "run-other",
                workoutActivityType: WorkoutActivityType.running,
                startDate: "2024-02-11T10:00:00.000Z",
                endDate: "2024-02-11T11:00:00.000Z",
                duration: { quantity: 3600 },
                distance: 9,
                sourceRevision: {
                    source: {
                        name: "Other",
                        bundleIdentifier: "com.some.otherapp",
                    },
                },
            },
        ]);

        const workouts = await fetchAppleHealthWorkouts();

        expect(workouts).toHaveLength(1);
        expect(workouts[0].id).toBe("run-other");
    });
});

const createSignal = () => {
    let resolve!: () => void;
    const promise = new Promise<void>((complete) => {
        resolve = complete;
    });
    return { promise, resolve };
};

describe("syncAppleHealthRunsToDatabase", () => {
    it("inserts only missing runs with stable IDs", async () => {
        const savedWorkouts: CompletedWorkout[] = [];

        const inserted = await syncAppleHealthRunsToDatabase(
            [
                {
                    id: "run-1",
                    name: "Run",
                    startDate: new Date("2024-02-01T10:00:00.000Z"),
                    endDate: new Date("2024-02-01T11:00:00.000Z"),
                    durationSeconds: 3600,
                    activityType: WorkoutActivityType.running,
                    workoutType: "run",
                    distance: 10,
                },
                {
                    id: "run-2",
                    name: "Run",
                    startDate: new Date("2024-02-02T10:00:00.000Z"),
                    endDate: new Date("2024-02-02T11:00:00.000Z"),
                    durationSeconds: 3600,
                    activityType: WorkoutActivityType.running,
                    workoutType: "run",
                    distance: 12,
                },
            ],
            {
                completeWorkouts: async (workouts) => {
                    savedWorkouts.push(...workouts);
                },
                fetchCompletedWorkoutIds: async () => ["apple-health:run-1"],
            }
        );

        expect(inserted).toBe(1);
        expect(savedWorkouts).toHaveLength(1);
        expect(savedWorkouts[0]).toMatchObject({
            id: "apple-health:run-2",
            type: "run",
            distance: 12,
        });
    });

    it("imports multiple missing runs once and excludes strength workouts", async () => {
        const savedBatches: CompletedWorkout[][] = [];
        const run = healthRunFactory("run-1");

        const inserted = await syncAppleHealthRunsToDatabase(
            [
                run,
                run,
                healthRunFactory("run-2"),
                { ...run, id: "strength-1", workoutType: "strength" },
            ],
            {
                completeWorkouts: async (workouts) => {
                    savedBatches.push(workouts);
                },
                fetchCompletedWorkoutIds: async () => [],
            }
        );

        expect(inserted).toBe(2);
        expect(savedBatches).toHaveLength(1);
        expect(savedBatches[0].map((workout) => workout.id)).toEqual([
            "apple-health:run-1",
            "apple-health:run-2",
        ]);
    });

    it.each([
        { name: "empty history", workouts: [] },
        { name: "already imported history", workouts: [healthRunFactory("run-1")] },
    ])(
        "does not write a batch for $name",
        async ({ workouts }) => {
            const inserted = await syncAppleHealthRunsToDatabase(workouts, {
                fetchCompletedWorkoutIds: async () => ["apple-health:run-1"],
                completeWorkouts: async () => {
                    throw new Error("No batch should be written");
                },
            });

            expect(inserted).toBe(0);
        }
    );

    it("propagates a failed batch save", async () => {
        const error = new Error("Unable to save imported runs");

        const sync = syncAppleHealthRunsToDatabase([healthRunFactory("run-1")], {
            fetchCompletedWorkoutIds: async () => [],
            completeWorkouts: async () => {
                throw error;
            },
        });

        await expect(sync).rejects.toBe(error);
    });
});

function healthRunFactory(id: string): AppleHealthWorkout {
    return {
        id,
        name: "Run",
        startDate: new Date("2024-02-01T10:00:00.000Z"),
        endDate: new Date("2024-02-01T11:00:00.000Z"),
        durationSeconds: 3600,
        activityType: WorkoutActivityType.running,
        workoutType: "run",
        distance: 10,
    };
}
