import type { Workout } from "../../model/types";

export type WorkoutUndoField = "weight" | "reps" | "effortValue";

export type WorkoutUndoKey = {
    exerciseIdx: number;
    setIdx: number;
    field: WorkoutUndoField;
};

type UndoEntry = {
    key: WorkoutUndoKey;
    workout: Workout;
};

type TimeoutHandle = ReturnType<typeof setTimeout>;

type Scheduler = {
    setTimeout: (callback: () => void, timeoutMs: number) => TimeoutHandle;
    clearTimeout: (handle: TimeoutHandle) => void;
};

type WorkoutUndoStoreOptions = {
    maxEntries?: number;
    groupTimeoutMs?: number;
    scheduler?: Scheduler;
    onCanUndoChange?: (canUndo: boolean) => void;
};

export type WorkoutUndoStore = {
    recordEdit: (key: WorkoutUndoKey, previousWorkout: Workout) => void;
    finalizeCurrentGroup: () => void;
    popUndoWorkout: () => Workout | null;
    clear: () => void;
    canUndo: () => boolean;
};

const DEFAULT_MAX_ENTRIES = 20;
const DEFAULT_GROUP_TIMEOUT_MS = 1200;

export const createWorkoutUndoStore = (
    options: WorkoutUndoStoreOptions = {}
): WorkoutUndoStore => {
    const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    const groupTimeoutMs = options.groupTimeoutMs ?? DEFAULT_GROUP_TIMEOUT_MS;
    const scheduler = options.scheduler ?? {
        setTimeout,
        clearTimeout,
    };

    let entries: UndoEntry[] = [];
    let currentGroup: UndoEntry | null = null;
    let groupTimeoutHandle: TimeoutHandle | null = null;
    let lastCanUndo = false;

    const canUndo = () => entries.length > 0 || currentGroup != null;

    const notifyCanUndoChange = () => {
        const nextCanUndo = canUndo();
        if (nextCanUndo === lastCanUndo) {
            return;
        }
        lastCanUndo = nextCanUndo;
        options.onCanUndoChange?.(nextCanUndo);
    };

    const clearGroupTimeout = () => {
        if (groupTimeoutHandle == null) {
            return;
        }
        scheduler.clearTimeout(groupTimeoutHandle);
        groupTimeoutHandle = null;
    };

    const finalizeCurrentGroup = () => {
        if (currentGroup == null) {
            return;
        }

        clearGroupTimeout();
        entries = [...entries, currentGroup].slice(-maxEntries);
        currentGroup = null;
        notifyCanUndoChange();
    };

    const scheduleGroupTimeout = () => {
        clearGroupTimeout();
        if (groupTimeoutMs <= 0) {
            return;
        }
        groupTimeoutHandle = scheduler.setTimeout(
            finalizeCurrentGroup,
            groupTimeoutMs
        );
    };

    const recordEdit = (key: WorkoutUndoKey, previousWorkout: Workout) => {
        if (currentGroup != null && isSameUndoKey(currentGroup.key, key)) {
            scheduleGroupTimeout();
            return;
        }

        finalizeCurrentGroup();
        currentGroup = {
            key,
            workout: previousWorkout,
        };
        scheduleGroupTimeout();
        notifyCanUndoChange();
    };

    const popUndoWorkout = () => {
        finalizeCurrentGroup();
        const entry = entries[entries.length - 1];
        if (entry == null) {
            notifyCanUndoChange();
            return null;
        }

        entries = entries.slice(0, -1);
        notifyCanUndoChange();
        return entry.workout;
    };

    const clear = () => {
        clearGroupTimeout();
        entries = [];
        currentGroup = null;
        notifyCanUndoChange();
    };

    return {
        recordEdit,
        finalizeCurrentGroup,
        popUndoWorkout,
        clear,
        canUndo,
    };
};

const isSameUndoKey = (a: WorkoutUndoKey, b: WorkoutUndoKey): boolean =>
    a.exerciseIdx === b.exerciseIdx &&
    a.setIdx === b.setIdx &&
    a.field === b.field;
