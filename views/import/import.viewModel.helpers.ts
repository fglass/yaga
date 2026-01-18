import { ExerciseCategory } from "../../model/types";
import { normalizeExerciseName } from "../../model/import/import.helpers";

export const inferExerciseCategory = (
    exerciseName: string
): ExerciseCategory | null => {
    return inferCategoryFromKeywords(exerciseName);
};

const inferCategoryFromKeywords = (
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
        keywords: [
            "bench",
            "chest",
            "pec",
            "fly",
            "flye",
            "push up",
            "pushup",
        ],
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
