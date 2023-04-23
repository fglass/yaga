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

export interface Exercise {
    id: string;
    exerciseId: string; // FK to ExerciseDef
    notes: string[];
    sets: Set[];
}

export interface Set {
    id: string;
    weight: string;
    reps: string;
    finished: boolean;
}
