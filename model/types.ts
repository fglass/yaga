export type WorkoutType = "strength" | "run";

export interface ExerciseDef {
    name: string;
    category: string;
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
}

export interface Exercise {
    id: string;
    exerciseId: string;
    notes: Note[];
    sets: Set[];
}

export interface Set {
    id: string;
    weight: string;
    reps: string;
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
