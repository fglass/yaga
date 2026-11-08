export interface ImportRow {
    date: Date;
    workoutName: string;
    duration: string;
    exerciseName: string;
    setOrder: number | null;
    weight: string;
    reps: string;
    workoutNotes: string;
}

export interface ImportWorkoutGroup {
    key: string;
    name: string;
    startedAt: number;
    finishedAt: number;
    workoutNotes: string;
    exercises: ImportExerciseGroup[];
}

export interface ImportExerciseGroup {
    name: string;
    sets: ImportSet[];
}

export interface ImportSet {
    position: number;
    weight: string;
    reps: string;
}

export interface ImportParseResult {
    rows: ImportRow[];
    errors: string[];
    totalRows: number;
}

export interface ImportData {
    rows: ImportRow[];
    workouts: ImportWorkoutGroup[];
    exerciseNames: string[];
    workoutCount: number;
}

export interface ImportSummary {
    workoutsAdded: number;
    newExerciseDefs: number;
}
