import { generateGuid } from "../../utils/guid";
import { replaceDatabaseWithWorkouts } from "../database";
import { CompletedWorkout, ExerciseCategory, ExerciseDef } from "../types";
import { normalizeExerciseName } from "./import.helpers";
import { ImportData, ImportSummary } from "./import.types";

export const importWorkouts = async (
    data: ImportData
): Promise<ImportSummary> => {
    if (data.workouts.length === 0) {
        throw new Error("The CSV contains no workouts.");
    }

    const exerciseDefs: Record<string, ExerciseDef> = {};
    const exerciseIds = new Map<string, string>();
    for (const name of data.exerciseNames) {
        const id = generateGuid();
        exerciseIds.set(name, id);
        exerciseDefs[id] = {
            name,
            category: inferExerciseCategory(name) ?? "Other",
        };
    }

    const importedBy = `strong-csv@${new Date().toISOString()}`;
    const workouts: CompletedWorkout[] = data.workouts.map((workout) => ({
        id: generateGuid(),
        name: workout.name,
        notes: workout.workoutNotes,
        type: "strength",
        metadata: { importedBy },
        startTimestamp: workout.startedAt,
        endTimestamp: workout.finishedAt,
        exercises: workout.exercises.map((exercise) => {
            const exerciseId = exerciseIds.get(exercise.name);
            if (!exerciseId) {
                throw new Error(`Missing exercise: ${exercise.name}`);
            }
            return {
                id: generateGuid(),
                exerciseId,
                notes: [],
                sets: exercise.sets.map((set) => ({
                    id: generateGuid(),
                    weight: set.weight,
                    reps: set.reps,
                    effortValue: "",
                    effortUnit: "rpe",
                    type: "default",
                    finishTime: workout.finishedAt,
                })),
            };
        }),
    }));

    await replaceDatabaseWithWorkouts(exerciseDefs, workouts);
    return {
        workoutsAdded: workouts.length,
        newExerciseDefs: exerciseIds.size,
    };
};

const inferExerciseCategory = (
    exerciseName: string
): ExerciseCategory | null => {
    const normalized = normalizeExerciseName(exerciseName);
    for (const rule of CATEGORY_RULES) {
        for (const keyword of rule.keywords) {
            if (normalized.includes(keyword)) {
                return rule.category;
            }
        }
    }
    return null;
};

const CATEGORY_RULES: Array<{
    category: ExerciseCategory;
    keywords: string[];
}> = [
    {
        category: "Neck",
        keywords: ["neck"],
    },
    {
        category: "Chest",
        keywords: ["bench", "chest", "pec", "fly", "flye", "push up", "pushup"],
    },
    {
        category: "Back",
        keywords: [
            "row",
            "pull up",
            "pullup",
            "lat",
            "pulldown",
            "deadlift",
            "rdl",
        ],
    },
    {
        category: "Shoulders",
        keywords: [
            "shoulder",
            "overhead press",
            "ohp",
            "military press",
            "arnold press",
            "lateral raise",
            "front raise",
            "rear delt",
        ],
    },
    {
        category: "Biceps",
        keywords: ["bicep", "biceps", "curl", "hammer", "preacher"],
    },
    {
        category: "Triceps",
        keywords: [
            "tricep",
            "triceps",
            "skullcrusher",
            "pushdown",
            "pressdown",
        ],
    },
    {
        category: "Legs",
        keywords: [
            "squat",
            "lunge",
            "leg",
            "calf",
            "hip",
            "glute",
            "hamstring",
            "quad",
        ],
    },
    {
        category: "Core",
        keywords: [
            "plank",
            "crunch",
            "sit up",
            "situp",
            "leg raise",
            "ab",
            "core",
        ],
    },
];
