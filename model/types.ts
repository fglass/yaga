export type WorkoutType = "strength" | "run";

export const EXERCISE_CATEGORIES = [
    "Back",
    "Biceps",
    "Chest",
    "Core",
    "Legs",
    "Neck",
    "Shoulders",
    "Triceps",
    "Other",
] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export type WorkoutMetadataValue = string | number | boolean | null;

export interface WorkoutMetadata {
    importedBy?: string;
    stravaActivityId?: string;
    [key: string]: WorkoutMetadataValue | undefined;
}

export interface ExerciseDef {
    name: string;
    category: ExerciseCategory;
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    exercises: Exercise[];
    notes: string;
    type: WorkoutType;
}

export interface Workout {
    id: string;
    name: string;
    exercises: Exercise[];
    notes: string;
    type: WorkoutType;
    metadata: WorkoutMetadata;
    startTimestamp: number;
    // Running only
    distance?: number;
}

export interface CompletedWorkout extends Workout {
    endTimestamp: number;
}

export interface AppleHealthWorkout {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    durationSeconds: number;
    activityType: number;
    workoutType: WorkoutType;
    distance?: number;
}

export interface Exercise {
    id: string;
    exerciseId: string;
    notes: Note[];
    sets: Set[];
}

export const SET_TYPES = ["default", "warmup", "drop"] as const;

export type SetType = (typeof SET_TYPES)[number];

export interface Set {
    id: string;
    weight: string;
    reps: string;
    type: SetType;
    finishTime: number | undefined;
}

export interface Note {
    id: string;
    value: string;
}

export enum ModalType { // Bit field
    None = 0,
    ExerciseList = 1,
    NewExercise = 2,
    ExerciseHistory = 4,
}
