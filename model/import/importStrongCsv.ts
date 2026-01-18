import {
    ImportData,
    ImportExerciseGroup,
    ImportParseResult,
    ImportRow,
    ImportWorkoutGroup,
} from "./import.types";
import {
    buildHeaderMap,
    getColumn,
    parseCsv,
    parseDurationSeconds,
    parseNumberOrNull,
    parseStrongDate,
} from "./import.helpers";

// Strong import shortcuts:
// - Per-set Notes are ignored.
// - Distance, Seconds, and RPE are ignored.
// - Duration supports Xm or Xh Ym; otherwise treated as missing.
export const STRONG_REQUIRED_COLUMNS = [
    "Date",
    "Workout Name",
    "Duration",
    "Exercise Name",
    "Set Order",
    "Weight",
    "Reps",
    "Distance",
    "Seconds",
    "Notes",
    "Workout Notes",
    "RPE",
];

export const parseStrongCsv = (csvText: string): ImportParseResult => {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
        return {
            rows: [],
            errors: ["CSV file is empty."],
            totalRows: 0,
        };
    }

    const header = rows[0];
    const headerMap = buildHeaderMap(header);
    const missingColumns = STRONG_REQUIRED_COLUMNS.filter(
        (col) => headerMap[col] == null
    );

    if (missingColumns.length > 0) {
        return {
            rows: [],
            errors: [
                `Missing required columns: ${missingColumns.join(", ")}.`,
            ],
            totalRows: rows.length - 1,
        };
    }

    const parsedRows: ImportRow[] = [];
    const errors: string[] = [];

    for (let idx = 1; idx < rows.length; idx += 1) {
        const row = rows[idx];
        if (row.every((value) => value.trim() === "")) {
            continue;
        }

        const dateValue = getColumn(row, headerMap, "Date");
        const workoutName = getColumn(row, headerMap, "Workout Name");
        const duration = getColumn(row, headerMap, "Duration");
        const exerciseName = getColumn(row, headerMap, "Exercise Name");
        const setOrderValue = getColumn(row, headerMap, "Set Order");
        const weight = getColumn(row, headerMap, "Weight");
        const reps = getColumn(row, headerMap, "Reps");
        const workoutNotes = getColumn(row, headerMap, "Workout Notes");

        if (!dateValue || !workoutName || !exerciseName) {
            errors.push(`Row ${idx + 1}: missing required fields.`);
            continue;
        }
        if (setOrderValue?.trim() === "Rest Timer") {
            continue;
        }

        const parsedDate = parseStrongDate(dateValue);
        if (!parsedDate) {
            errors.push(`Row ${idx + 1}: invalid Date value.`);
            continue;
        }

        const setOrder = parseNumberOrNull(setOrderValue);

        parsedRows.push({
            date: parsedDate,
            workoutName,
            duration,
            exerciseName,
            setOrder,
            weight: weight ?? "",
            reps: reps ?? "",
            workoutNotes: workoutNotes ?? "",
        });
    }

    return {
        rows: parsedRows,
        errors,
        totalRows: rows.length - 1,
    };
};

export const buildImportData = (
    rows: ImportRow[]
): ImportData => {
    const workoutsByKey = new Map<string, ImportWorkoutGroup>();
    const exerciseNames: string[] = [];

    rows.forEach((row) => {
        const startedAt = row.date.getTime();
        const workoutKey = `${row.workoutName}__${startedAt}`;
        const durationSeconds = parseDurationSeconds(row.duration);
        const finishedAt =
            durationSeconds != null
                ? startedAt + durationSeconds * 1000
                : startedAt;

        if (!workoutsByKey.has(workoutKey)) {
            workoutsByKey.set(workoutKey, {
                key: workoutKey,
                name: row.workoutName,
                startedAt,
                finishedAt,
                workoutNotes: row.workoutNotes,
                exercises: [],
            });
        }

        const workout = workoutsByKey.get(workoutKey);
        if (!workout) {
            return;
        }
        if (!workout.workoutNotes && row.workoutNotes) {
            workout.workoutNotes = row.workoutNotes;
        }

        const exerciseGroup = getOrCreateExercise(workout, row.exerciseName);
        const position =
            row.setOrder != null ? row.setOrder - 1 : exerciseGroup.sets.length;
        exerciseGroup.sets.push({
            position: Math.max(0, position),
            weight: row.weight ?? "",
            reps: row.reps ?? "",
        });

        if (!exerciseNames.includes(row.exerciseName)) {
            exerciseNames.push(row.exerciseName);
        }
    });

    return {
        rows,
        workouts: Array.from(workoutsByKey.values()),
        exerciseNames,
        workoutCount: workoutsByKey.size,
    };
};


const getOrCreateExercise = (
    workout: ImportWorkoutGroup,
    name: string
): ImportExerciseGroup => {
    const existing = workout.exercises.find(
        (exercise) => exercise.name === name
    );
    if (existing) {
        return existing;
    }

    const created = { name, sets: [] };
    workout.exercises.push(created);
    return created;
};
