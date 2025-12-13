import { generateGuid } from "../../util";
import { ExerciseDef, Workout } from "../types";

enum Exercise {
    BenchPress = "d290f1ee-6c54-4b01-90e6-d701748f0851",
    BentOverRow = "11db0a81-0c16-465c-8a09-d953fee83ff5",
    CalfPressOnSeatedLegPress = "3d4be6a2-118a-4db0-b840-dc8701f44da1",
    CalfRaiseSeated = "fb87dc04-da1c-4481-a3df-1776662c4a01",
    CrunchDecline = "a2c76e04-980b-42cb-8a90-ba56d764741c",
    CrunchMachine = "a5ad3d7d-21b1-4de7-a5ed-5ed8a531ac53",
    Deadlift = "14ffd72a-dd45-47a8-87d3-51b5d04093b6",
    FacePull = "99f6a34d-1053-4d43-9aff-121e4457c27b",
    CurleCableReverse = "1ce1fc5b-d87f-4ad6-b73e-226ec014db97",
    CurlCableSingle = "a0e427a2-6862-4e42-81f0-9b000b46bdc9",
    CurlHammer = "e494222e-88a2-41e8-bd6b-e0c84ee38c74",
    CurlIncline = "d7b6f5cd-501e-4aef-b05f-45296205e11f",
    CurlMachine = "01d074cb-15c1-45bd-a592-dfc5033139c1",
    CurlPreacher = "7a03e425-be92-4c2c-a0d7-fd2749cd41dc",
    CurlReverse = "69ee1222-419a-4338-9409-b76afe104109",
    LateralRaise = "42a63d67-e4ca-4cf4-aad7-0e606d5f70e8",
    LateralRaiseMachine = "4ae1efd3-b738-46bd-9e62-475e81db6970",
    LatPulldown = "a03954ed-477f-4cc7-8d30-7fc2ac82635a",
    LatPulldownClose = "b637579a-38f7-4a4e-a741-c1f0cbb93282",
    LatPulldownKneeling = "357310e0-f111-4a6a-acff-84eafa0acaba",
    LegExtensions = "a1b0b1a0-1a20-4ccc-bf81-d5825923f8c8",
    LyingLegCurl = "34da1abc-cfbc-4dda-b2b5-58c16de24d3a",
    NeckCurl = "62d73123-1ffd-4dbf-a28e-0ae4b751d135",
    OverheadPress = "bae49855-0c29-4834-bd65-4b1a081bd87c",
    PullDownRope = "84ca598b-cd0b-43d8-8687-89d9b8537afb",
    PullUp = "0acf0b5e-b0c7-4f2e-ac94-f20c2bbe3bc9",
    RomanianDeadlift = "fe5d9291-0be6-4dfd-9ca7-a9b8c05f2f52",
    RomanChairLegRaises = "4ce5ec6a-94aa-49b5-9144-81940d9dfa5f",
    ReverseFly = "ba9415ee-7c93-4eae-9996-3b2f5f3ee77e",
    RowMachineSeated = "e55322b1-02a4-4eda-9476-fa7107bd8e2e",
    ShoulderPressDumbell = "8ebdd214-e6f9-40c9-b409-f15e5a883121",
    ShoulderPressMachine = "41d6aa23-c8b4-46f8-a738-769bb9ea2994",
    CableRow = "09fbfa85-d2a9-438f-9606-e59160e5108f",
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
    [Exercise.BentOverRow]: {
        name: "Bent Over Row",
        category: "Back",
    },
    [Exercise.LatPulldown]: {
        name: "Lat Pulldown",
        category: "Back",
    },
    [Exercise.LatPulldownClose]: {
        name: "Lat Pulldown (Close)",
        category: "Back",
    },
    [Exercise.LatPulldownKneeling]: {
        name: "Kneeling Lat Pulldown",
        category: "Back",
    },
    [Exercise.CableRow]: {
        name: "Cable Row",
        category: "Back",
    },
    [Exercise.RowMachineSeated]: {
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
    /* Biceps */
    [Exercise.CurlCableSingle]: {
        name: "Single Cable Curl",
        category: "Biceps",
    },
    [Exercise.CurleCableReverse]: {
        name: "Reverse Cable Curl",
        category: "Biceps",
    },
    [Exercise.CurlHammer]: {
        name: "Hammer Curl",
        category: "Biceps",
    },
    [Exercise.CurlMachine]: {
        name: "Machine Curl",
        category: "Biceps",
    },
    [Exercise.CurlIncline]: {
        name: "Incline Curl",
        category: "Biceps",
    },
    [Exercise.CurlReverse]: {
        name: "Reverse Curl",
        category: "Biceps",
    },
    [Exercise.CurlPreacher]: {
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
    [Exercise.RomanChairLegRaises]: {
        name: "Roman Chair Leg Raises",
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
    [Exercise.CalfRaiseSeated]: {
        name: "Seated Calf Raise",
        category: "Legs",
    },
    /* Neck */
    [Exercise.NeckCurl]: {
        name: "Neck Curl",
        category: "Neck",
    },
    /* Shoulders */
    [Exercise.OverheadPress]: {
        name: "OHP",
        category: "Shoulders",
    },
    [Exercise.ShoulderPressDumbell]: {
        name: "Shoulder Press Dumbbell",
        category: "Shoulders",
    },
    [Exercise.ShoulderPressMachine]: {
        name: "Shoulder Press Machine",
        category: "Shoulders",
    },
    [Exercise.LateralRaise]: {
        name: "Lateral Raise",
        category: "Shoulders",
    },
    [Exercise.LateralRaiseMachine]: {
        name: "Lateral Raise Machine",
        category: "Shoulders",
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
                exerciseId: Exercise.BentOverRow,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
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
                exerciseId: Exercise.RowMachineSeated,
                notes: [{ id: generateGuid(), value: "5 - 6" }],
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
                exerciseId: Exercise.CalfRaiseSeated,
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
                exerciseId: Exercise.PullUp,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.CableRow,
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
                exerciseId: Exercise.CurlHammer,
                notes: [],
                sets: [
                    { id: "0", weight: "", reps: "", finishTime: undefined },
                    { id: "1", weight: "", reps: "", finishTime: undefined },
                    { id: "2", weight: "", reps: "", finishTime: undefined },
                ],
            },
            {
                id: generateGuid(),
                exerciseId: Exercise.CurlIncline,
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
