import { generateGuid } from "../util";
import { ExerciseDef, Workout } from "./types";

enum Exercise {
    Squat = "6a001abb-1a20-4ccc-bf81-d5825923f8c8",
    LyingLegCurl = "34da1abc-cfbc-4dda-b2b5-58c16de24d3a",
    SeatedCalfRaise = "fb87dc04-da1c-4481-a3df-1776662c4a01",
    LegExtensions = "a1b0b1a0-1a20-4ccc-bf81-d5825923f8c8",
}

export const EXERCISE_DEFS: Record<string, ExerciseDef> = {
    [Exercise.Squat]: {
        name: "Squat",
        category: "Legs",
    },
    [Exercise.LyingLegCurl]: {
        name: "Lying Leg Curl",
        category: "Legs",
    },
    [Exercise.LegExtensions]: {
        name: "Leg Extensions",
        category: "Legs",
    },
    [Exercise.SeatedCalfRaise]: {
        name: "Seated Calf Raise",
        category: "Legs",
    },
};

export const WORKOUTS: Workout[] = [
    {
        id: generateGuid(),
        name: "Legs #1",
        exercises: [
            {
                id: generateGuid(),
                exerciseId: Exercise.Squat,
                notes: [
                    {
                        id: generateGuid(),
                        value: "1 - 0 - 3",
                    },
                ],

                sets: [
                    { id: "0", weight: "", reps: "", finished: false },
                    { id: "1", weight: "", reps: "", finished: false },
                    { id: "2", weight: "", reps: "", finished: false },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.LyingLegCurl,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finished: false },
                    { id: "1", weight: "", reps: "", finished: false },
                    { id: "2", weight: "", reps: "", finished: false },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.LegExtensions,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finished: false },
                    { id: "1", weight: "", reps: "", finished: false },
                    { id: "2", weight: "", reps: "", finished: false },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.SeatedCalfRaise,
                notes: [
                    {
                        id: generateGuid(),
                        value: "5x5",
                    },
                ],
                sets: [
                    { id: "0", weight: "", reps: "", finished: false },
                    { id: "1", weight: "", reps: "", finished: false },
                    { id: "2", weight: "", reps: "", finished: false },
                ],
            },
        ],
        notes: "",
    },
    {
        id: generateGuid(),
        name: "Legs #2",
        exercises: [],
        notes: "",
    },
];
