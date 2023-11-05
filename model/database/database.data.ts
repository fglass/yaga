import { generateGuid } from "../../util";
import { ExerciseDef, Workout } from "../types";

enum Exercise {
    DeclineCrunch = "94e6365e-e475-4e7d-b6d5-0b911435fab0",
    FacePull = "99f6a34d-1053-4d43-9aff-121e4457c27b",
    HammerCurl = "e494222e-88a2-41e8-bd6b-e0c84ee38c74",
    InclineCurl = "d7b6f5cd-501e-4aef-b05f-45296205e11f",
    KneelingLatPulldown = "357310e0-f111-4a6a-acff-84eafa0acaba",
    LatPulldown = "a03954ed-477f-4cc7-8d30-7fc2ac82635a",
    LegExtensions = "a1b0b1a0-1a20-4ccc-bf81-d5825923f8c8",
    LyingLegCurl = "34da1abc-cfbc-4dda-b2b5-58c16de24d3a",
    NeckCurl = "62d73123-1ffd-4dbf-a28e-0ae4b751d135",
    PreacherCurl = "7a03e425-be92-4c2c-a0d7-fd2749cd41dc",
    PullUp = "0acf0b5e-b0c7-4f2e-ac94-f20c2bbe3bc9",
    ReverseCurl = "69ee1222-419a-4338-9409-b76afe104109",
    ReverseFly = "ba9415ee-7c93-4eae-9996-3b2f5f3ee77e",
    SeatedCalfRaise = "fb87dc04-da1c-4481-a3df-1776662c4a01",
    SeatedRow = "09fbfa85-d2a9-438f-9606-e59160e5108f",
    Squat = "6a001abb-1a20-4ccc-bf81-d5825923f8c8",
}

export const EXERCISE_DEFS: Record<string, ExerciseDef> = {
    [Exercise.LatPulldown]: {
        name: "Lat Pulldown",
        category: "Back",
    },
    [Exercise.SeatedRow]: {
        name: "Seated Row",
        category: "Back",
    },
    [Exercise.FacePull]: {
        name: "Face Pull",
        category: "Back",
    },
    [Exercise.ReverseCurl]: {
        name: "Reverse Curl",
        category: "Biceps",
    },
    [Exercise.PreacherCurl]: {
        name: "Preacher Curl",
        category: "Biceps",
    },
    [Exercise.DeclineCrunch]: {
        name: "Decline Crunch",
        category: "Core",
    },
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
    [Exercise.HammerCurl]: {
        name: "Hammer Curl",
        category: "Biceps",
    },
    [Exercise.InclineCurl]: {
        name: "Incline Curl",
        category: "Biceps",
    },
    [Exercise.PullUp]: {
        name: "Pull Up",
        category: "Back",
    },
    [Exercise.ReverseFly]: {
        name: "Reverse Fly",
        category: "Back",
    },
    [Exercise.NeckCurl]: {
        name: "Neck Curl",
        category: "Neck",
    },
    [Exercise.KneelingLatPulldown]: {
        name: "Kneeling Lat Pulldown",
        category: "Back",
    },
};

export const WORKOUT_TEMPLATES: Workout[] = [
    {
        id: generateGuid(),
        name: "Pull #1",
        exercises: [
            {
                id: generateGuid(),
                exerciseId: Exercise.LatPulldown,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                    { id: "3", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.SeatedRow,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.FacePull,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.ReverseCurl,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.PreacherCurl,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.DeclineCrunch,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
        ],
        notes: "",
    },
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
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.LyingLegCurl,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.LegExtensions,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
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
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
        ],
        notes: "",
    },
    {
        id: generateGuid(),
        name: "New Workout",
        exercises: [],
        notes: "",
    },
];
