export interface ExerciseDef {
    name: string;
    category: string;
}

export interface Workout {
    name: string;
    exercises: Exercise[];
    notes: string;
}

export interface Exercise {
    id: string;
    exerciseId: string; // Foreign key to ExerciseDef
    notes: string[];
    sets: Set[];
}

export interface Set {
    id: string;
    weight: string;
    reps: string;
    finished: boolean;
}

export const exerciseDefs: Record<string, ExerciseDef> = {
    "0": {
        name: "Squat",
        category: "Legs",
    },
    "1": {
        name: "Lying Leg Curl",
        category: "Legs",
    },
    "2": {
        name: "Seated Calf Raise",
        category: "Legs",
    },
};

const dummyExercises: Exercise[] = [
    {
        id: "6bb456eb-e10a-4328-8d89-eabc78eacba1",
        exerciseId: "0",
        notes: [],
        sets: [
            { id: "0", weight: "140", reps: "5", finished: false },
            { id: "1", weight: "140", reps: "5", finished: false },
            { id: "2", weight: "140", reps: "5", finished: false },
        ],
    },
    {
        id: "2f40e9c3-c7a3-49b7-a053-d41489c487fc",
        exerciseId: "1",
        notes: [],
        sets: [
            { id: "0", weight: "66", reps: "12", finished: false },
            { id: "1", weight: "66", reps: "10", finished: false },
            { id: "2", weight: "66", reps: "8", finished: false },
        ],
    },
    {
        id: "ba3aed70-494b-4a47-91c6-d96438711784",
        exerciseId: "2",
        notes: ["5x5"],
        sets: [
            { id: "0", weight: "138", reps: "20", finished: false },
            { id: "1", weight: "138", reps: "15", finished: false },
            { id: "2", weight: "138", reps: "15", finished: false },
        ],
    },
];

export const dummyWorkout: Workout = {
    name: "Legs #1",
    exercises: dummyExercises,
    notes: "",
};
