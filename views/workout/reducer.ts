import produce from "immer";
import { Exercise, Note, Set, Workout } from "../../model/types";
import { generateGuid } from "../../util";

type Action = {
    type: ActionType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

export enum ActionType {
    ChangeWorkoutNotes = "change-workout-notes",
    ChangeExerciseNote = "change-exçercise-note",
    ChangeWeight = "change-weight",
    ChangeReps = "change-reps",
    FinishSet = "finish-set",
    RemoveSet = "remove-set",
    RemoveExerciseNote = "remove-exercise-note",
    AddSet = "add-set",
    AddExerciseNote = "add-exercise-note",
    AddExercise = "add-exercise",
    RemoveExercise = "remove-exercise",
}

export const workoutProducer = produce((draft: Workout, action: Action) => {
    switch (action.type) {
        case ActionType.ChangeWorkoutNotes:
            draft.notes = action.notes;
            break;
        case ActionType.ChangeExerciseNote:
            draft.exercises[action.exerciseIdx].notes[action.noteIdx].value =
                action.notes;
            break;
        case ActionType.ChangeWeight:
            draft.exercises[action.exerciseIdx].sets[action.setIdx].weight =
                action.weight;
            break;
        case ActionType.ChangeReps:
            draft.exercises[action.exerciseIdx].sets[action.setIdx].reps =
                action.reps;
            break;
        case ActionType.FinishSet:
            draft.exercises[action.exerciseIdx].sets[action.setIdx].finished =
                !draft.exercises[action.exerciseIdx].sets[action.setIdx]
                    .finished;
            break;
        case ActionType.RemoveSet:
            draft.exercises[action.exerciseIdx].sets.splice(action.setIdx, 1);
            break;
        case ActionType.RemoveExerciseNote:
            draft.exercises[action.exerciseIdx].notes.splice(action.noteIdx, 1);
            break;
        case ActionType.AddSet: {
            const newSet = createNewSet();

            const lastSet =
                draft.exercises[action.exerciseIdx].sets[
                    draft.exercises[action.exerciseIdx].sets.length - 1
                ];

            if (lastSet !== undefined) {
                newSet.weight = lastSet.weight;
                newSet.reps = lastSet.reps;
            }

            draft.exercises[action.exerciseIdx].sets.push(newSet);
            break;
        }
        case ActionType.AddExerciseNote:
            draft.exercises[action.exerciseIdx].notes.push(createNewNote());
            break;
        case ActionType.AddExercise:
            draft.exercises.push(createNewExercise(action.exerciseId));
            break;
        case ActionType.RemoveExercise:
            draft.exercises.splice(action.exerciseIdx, 1);
            break;
        default:
            console.error("Unknown action type: ", action.type);
            break;
    }
});

const createNewExercise = (exerciseId: string): Exercise => ({
    id: generateGuid(),
    exerciseId: exerciseId,
    notes: [],
    sets: [createNewSet()],
});

const createNewSet = (): Set => ({
    id: generateGuid(),
    weight: "0",
    reps: "1",
    finished: false,
});

const createNewNote = (): Note => ({
    id: generateGuid(),
    value: "",
});
