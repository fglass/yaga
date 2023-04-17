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

const dummyExercises: Exercise[] = [
    {
        id: "6bb456eb-e10a-4328-8d89-eabc78eacba1",
        exerciseId: "6a001abb-1a20-4ccc-bf81-d5825923f8c8",
        notes: ["1 - 0 - 3"],
        sets: [
            { id: "0", weight: "140", reps: "5", finished: false },
            { id: "1", weight: "140", reps: "5", finished: false },
            { id: "2", weight: "140", reps: "5", finished: false },
        ],
    },
    {
        id: "2f40e9c3-c7a3-49b7-a053-d41489c487fc",
        exerciseId: "34da1abc-cfbc-4dda-b2b5-58c16de24d3a",
        notes: [],
        sets: [
            { id: "0", weight: "66", reps: "12", finished: false },
            { id: "1", weight: "66", reps: "10", finished: false },
            { id: "2", weight: "66", reps: "8", finished: false },
        ],
    },
    {
        id: "ba3aed70-494b-4a47-91c6-d96438711784",
        exerciseId: "fb87dc04-da1c-4481-a3df-1776662c4a01",
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
