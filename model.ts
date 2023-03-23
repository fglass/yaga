export interface Workout {
    name: string;
    exercises: Exercise[];
    notes: string;
}

export interface Exercise {
    id: string;
    name: string;
    notes: string;
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
        id: "1",
        name: "Squat",
        notes: "5x5",
        sets: [
            { id: "1", weight: "140", reps: "5", finished: false },
            { id: "2", weight: "140", reps: "5", finished: false },
            { id: "3", weight: "140", reps: "5", finished: false },
        ],
    },
    {
        id: "2",
        name: "Lying Leg Curl",
        notes: "1 - 0 - 3",
        sets: [
            { id: "1", weight: "66", reps: "12", finished: false },
            { id: "2", weight: "66", reps: "10", finished: false },
            { id: "3", weight: "66", reps: "8", finished: false },
        ],
    },
    {
        id: "3",
        name: "Seated Calf Raise",
        notes: "",
        sets: [
            { id: "1", weight: "138", reps: "20", finished: false },
            { id: "2", weight: "138", reps: "15", finished: false },
            { id: "3", weight: "138", reps: "15", finished: false },
        ],
    },
];

export const dummyWorkout: Workout = {
    name: "Legs #1",
    exercises: dummyExercises,
    notes: "Notes",
};
