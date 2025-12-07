import { generateGuid } from "../../util";
import { ExerciseDef, Workout } from "../types";

enum Exercise {
    BenchPress = "d290f1ee-6c54-4b01-90e6-d701748f0851",
    CalfPressOnSeatedLegPress = "3d4be6a2-118a-4db0-b840-dc8701f44da1",
    CrunchDecline = "a2c76e04-980b-42cb-8a90-ba56d764741c",
    CrunchMachine = "a5ad3d7d-21b1-4de7-a5ed-5ed8a531ac53",
    Deadlift = "14ffd72a-dd45-47a8-87d3-51b5d04093b6",
    FacePull = "99f6a34d-1053-4d43-9aff-121e4457c27b",
    HammerCurl = "e494222e-88a2-41e8-bd6b-e0c84ee38c74",
    InclineCurl = "d7b6f5cd-501e-4aef-b05f-45296205e11f",
    KneelingLatPulldown = "357310e0-f111-4a6a-acff-84eafa0acaba",
    LatPulldown = "a03954ed-477f-4cc7-8d30-7fc2ac82635a",
    LegExtensions = "a1b0b1a0-1a20-4ccc-bf81-d5825923f8c8",
    LyingLegCurl = "34da1abc-cfbc-4dda-b2b5-58c16de24d3a",
    NeckCurl = "62d73123-1ffd-4dbf-a28e-0ae4b751d135",
    PreacherCurl = "7a03e425-be92-4c2c-a0d7-fd2749cd41dc",
    PullDownRope = "84ca598b-cd0b-43d8-8687-89d9b8537afb",
    PullUp = "0acf0b5e-b0c7-4f2e-ac94-f20c2bbe3bc9",
    RomanianDeadlift = "fe5d9291-0be6-4dfd-9ca7-a9b8c05f2f52",
    ReverseCurl = "69ee1222-419a-4338-9409-b76afe104109",
    ReverseFly = "ba9415ee-7c93-4eae-9996-3b2f5f3ee77e",
    SeatedCalfRaise = "fb87dc04-da1c-4481-a3df-1776662c4a01",
    SeatedRow = "09fbfa85-d2a9-438f-9606-e59160e5108f",
    Squat = "6a001abb-1a20-4ccc-bf81-d5825923f8c8",
}

export const EXERCISE_DEFS: Record<Exercise, ExerciseDef> = {
    /* Chest */
    [Exercise.BenchPress]: {
        name: "Bench Press",
        category: "Chest",
    },
    /* Back */
    [Exercise.Deadlift]: {
        name: "Deadlift",
        category: "Back",
    },
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
    [Exercise.PullUp]: {
        name: "Pull Up",
        category: "Back",
    },
    [Exercise.ReverseFly]: {
        name: "Reverse Fly",
        category: "Back",
    },
    [Exercise.KneelingLatPulldown]: {
        name: "Kneeling Lat Pulldown",
        category: "Back",
    },
    /* Biceps */
    [Exercise.HammerCurl]: {
        name: "Hammer Curl",
        category: "Biceps",
    },
    [Exercise.InclineCurl]: {
        name: "Incline Curl",
        category: "Biceps",
    },
    [Exercise.ReverseCurl]: {
        name: "Reverse Curl",
        category: "Biceps",
    },
    [Exercise.PreacherCurl]: {
        name: "Preacher Curl",
        category: "Biceps",
    },
    /* Core */
    [Exercise.CrunchMachine]: {
        name: "Crunch Machine",
        category: "Core",
    },
    [Exercise.CrunchDecline]: {
        name: "Decline Crunch",
        category: "Core",
    },
    /* Legs */
    [Exercise.Squat]: {
        name: "Squat",
        category: "Legs",
    },
    [Exercise.RomanianDeadlift]: {
        name: "RDL",
        category: "Legs",
    },
    [Exercise.LegExtensions]: {
        name: "Leg Extensions",
        category: "Legs",
    },
    [Exercise.LyingLegCurl]: {
        name: "Lying Leg Curl",
        category: "Legs",
    },
    [Exercise.CalfPressOnSeatedLegPress]: {
        name: "Calf Press (Seated Leg Press)",
        category: "Legs",
    },
    [Exercise.SeatedCalfRaise]: {
        name: "Seated Calf Raise",
        category: "Legs",
    },
    /* Neck */
    [Exercise.NeckCurl]: {
        name: "Neck Curl",
        category: "Neck",
    },
    /* Triceps */
    [Exercise.PullDownRope]: {
        name: "Rope Pull Down",
        category: "Triceps",
    },
};

export const WORKOUT_TEMPLATES: Workout[] = [
    {
        id: "1e2509c1-98c5-4747-a239-ab9d0898dbe1",
        name: "👆 Push #1",
        exercises: [
            {
                id: generateGuid(),
                exerciseId: Exercise.BenchPress,
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
        id: "c45961ce-85ac-41a1-a6fa-c88ffa5fa2fd",
        name: "👇 Pull #1",
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
        ],
        notes: "",
    },
    {
        id: "585f3af5-e469-40e5-8591-2e16cfd33524",
        name: "🦵 Legs #1",
        exercises: [
            {
                id: generateGuid(),
                exerciseId: Exercise.Squat,
                notes: [],
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
        id: "dea6b833-dd5f-4c5b-9d11-e67b8b1e2e4f",
        name: "🔼 Push #2",
        exercises: [
            {
                id: generateGuid(),
                exerciseId: Exercise.BenchPress,
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
        id: "2634a7cf-e293-45b3-95d7-134acc260da4",
        name: "🔽 Pull #2",
        exercises: [
            {
                id: generateGuid(),
                exerciseId: Exercise.Deadlift,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.PullUp,
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
        id: "d6aecfef-9f28-4975-b3f8-48e8ab58ed70",
        name: "🦿 Legs #2",
        exercises: [
            {
                id: generateGuid(),
                exerciseId: Exercise.RomanianDeadlift,
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
        id: "42c73ac4-50a8-44ea-ad50-18e844c53d0c",
        name: "💪 Arms",
        exercises: [
            {
                id: generateGuid(),
                exerciseId: Exercise.HammerCurl,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.InclineCurl,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.PullDownRope,
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
];
