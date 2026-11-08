import type { AlertButton } from "react-native";
import {
    createImportViewModelCore,
    ImportViewModelDeps,
} from "../import.viewModel.core";
import { importWorkouts } from "../../../model/import/importWorkouts";
// Test-only database harness for exercising the view model against SQLite
// eslint-disable-next-line no-restricted-imports
import {
    createTestDb,
    completedWorkoutFactory,
} from "../../../model/database/database.test.helpers";

const HEADER =
    "Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE";
const CSV = `${HEADER}\n2022-12-30 11:34:35,Legs,33m,Single Leg Extension,1,66,14,0,0,,Workout notes,\n2022-12-31 11:34:35,Legs,33m,Single Leg Extension,1,67,12,0,0,,,`;

const createHarness = (overrides: Partial<ImportViewModelDeps> = {}) => {
    const state = {
        closed: false,
        importing: false,
        refreshed: false,
        success: false,
        imports: 0,
    };
    const alerts: Array<{
        title: string;
        message?: string;
        buttons?: AlertButton[];
    }> = [];
    const vm = createImportViewModelCore({
        onClose: () => {
            state.closed = true;
        },
        setImporting: (value) => {
            state.importing = value;
        },
        deps: {
            readFileText: async () => CSV,
            importWorkouts: async () => {
                state.imports += 1;
                return { workoutsAdded: 2, newExerciseDefs: 1 };
            },
            alert: (title, message, buttons) => {
                alerts.push({ title, message, buttons });
            },
            refreshDatabase: async () => {
                state.refreshed = true;
            },
            onSuccess: () => {
                state.success = true;
            },
            ...overrides,
        },
    });
    return { vm, state, alerts };
};

it.each([
    "invalid",
    HEADER,
    `${HEADER}\nnot-a-date,Legs,33m,Squat,1,60,8,,,,,`,
])(
    "rejects invalid or empty CSV without offering replacement",
    async (text) => {
        const { vm, state, alerts } = createHarness({
            readFileText: async () => text,
        });
        await vm.loadCsv("file.csv");
        expect(alerts[0].title).toBe("Import failed");
        expect(alerts[0].buttons).toBeUndefined();
        expect(state.imports).toBe(0);
        expect(state.closed).toBe(true);
    }
);

it("handles unreadable files without replacing data", async () => {
    const { vm, state, alerts } = createHarness({
        readFileText: async () => {
            throw new Error("Unreadable file");
        },
    });
    await vm.loadCsv("file.csv");
    expect(alerts[0].message).toBe("Unreadable file");
    expect(state.imports).toBe(0);
});

it("imports once, refreshes database state and reports success", async () => {
    const { vm, state, alerts } = createHarness();
    await vm.loadCsv("file.csv");
    await vm.loadCsv("file.csv");
    expect(state.imports).toBe(1);
    expect(state.importing).toBe(true);
    expect(state.refreshed).toBe(true);
    expect(state.success).toBe(true);
    expect(alerts[0].title).toBe("Import Complete");
    alerts[0].buttons?.[0].onPress?.();
    expect(state.closed).toBe(true);
});

it("replaces the database with only the CSV exercises and workouts", async () => {
    await createTestDb(async (database, sqlite) => {
        await database.completeWorkout(
            completedWorkoutFactory({ id: "old-workout" })
        );
        await database.saveActiveWorkout({
            id: "active",
            name: "Active",
            notes: "",
            metadata: {},
            startTimestamp: 1,
            type: "strength",
            exercises: [],
        });
        const { vm, alerts } = createHarness({ importWorkouts });
        await vm.loadCsv("file.csv");
        const defs = await database.fetchExerciseDefs();
        expect(Object.values(defs)).toEqual([
            { name: "Single Leg Extension", category: "Legs" },
        ]);
        expect(await database.fetchCompletedWorkoutIds()).toHaveLength(2);
        const db = await sqlite.getDatabase();
        expect(await db.getAllAsync("SELECT * FROM templates")).toEqual([]);
        expect(
            await db.getAllAsync(
                "SELECT * FROM workouts WHERE status = 'active'"
            )
        ).toEqual([]);
        const sets = await db.getAllAsync(
            "SELECT weight, reps FROM sets ORDER BY weight"
        );
        expect(sets).toEqual([
            { weight: "66", reps: "14" },
            { weight: "67", reps: "12" },
        ]);
        expect(alerts[0].title).toBe("Import Complete");
    });
});

it("preserves existing data when saving the replacement fails", async () => {
    await createTestDb(async (database, sqlite) => {
        await database.completeWorkout(
            completedWorkoutFactory({ id: "old-workout" })
        );
        const before = await database.fetchExerciseDefs();
        const db = await sqlite.getDatabase();
        await db.execAsync(
            "CREATE TRIGGER reject_import BEFORE INSERT ON workouts BEGIN SELECT RAISE(ABORT, 'Disk write failure'); END;"
        );
        const { vm, alerts, state } = createHarness({
            importWorkouts,
        });
        await vm.loadCsv("file.csv");
        expect(await database.fetchExerciseDefs()).toEqual(before);
        expect(await database.fetchCompletedWorkoutIds()).toEqual([
            "old-workout",
        ]);
        expect(alerts[0].title).toBe("Import failed");
        expect(state.success).toBe(false);
        expect(state.closed).toBe(true);
    });
});
