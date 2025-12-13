export interface ExerciseDef {
    name: string;
    category: string;
}

export interface Workout {
    id: string;
    name: string;
    exercises: Exercise[];
    notes: string;
}

export interface CompletedWorkout extends Workout {
    endTimestamp: number;
    duration: number;
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
    exerciseId: string; // FK to ExerciseDef
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
}
