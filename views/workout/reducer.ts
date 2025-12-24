import produce from "immer";
import { Exercise, Note, Set, Workout } from "../../model/types";
import { generateGuid } from "../../utils/util";

type Action = {
    type: ActionType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

export enum ActionType {
    ChangeWorkoutNotes = "change-workout-notes",
    ChangeExerciseNote = "change-exercise-note",
    ChangeWeight = "change-weight",
    ChangeReps = "change-reps",
    DecrementReps = "decrement-reps",
    FinishSet = "finish-set",
    RemoveSet = "remove-set",
    AddSet = "add-set",
    CopyToCurrentSet = "copy-to-current-set",
    RemoveExerciseNote = "remove-exercise-note",
    AddExerciseNote = "add-exercise-note",
    AddExercise = "add-exercise",
    RemoveExercise = "remove-exercise",
    MoveExercise = "move-exercise",
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
        case ActionType.DecrementReps: {
            const currentReps = Number(
                draft.exercises[action.exerciseIdx].sets[action.setIdx].reps
            );
            const nextReps = Math.max(
                0,
                isNaN(currentReps) ? 0 : currentReps - 1
            );
            draft.exercises[action.exerciseIdx].sets[
                action.setIdx
            ].reps = `${nextReps}`;
            break;
        }
        case ActionType.FinishSet:
            draft.exercises[action.exerciseIdx].sets[action.setIdx].finishTime =
                action.isFinished ? Date.now() : undefined;
            break;
        case ActionType.MoveExercise:
            [
                draft.exercises[action.exerciseIdx],
                draft.exercises[action.exerciseIdx + action.delta],
            ] = [
                draft.exercises[action.exerciseIdx + action.delta],
                draft.exercises[action.exerciseIdx],
            ];
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
        case ActionType.CopyToCurrentSet: {
            const sourceSet =
                draft.exercises[action.exerciseIdx].sets[action.setIdx];
            const currentSetIdx = draft.exercises[
                action.exerciseIdx
            ].sets.findIndex((set) => set.finishTime === undefined);

            if (
                currentSetIdx >= 0 &&
                currentSetIdx < draft.exercises[action.exerciseIdx].sets.length
            ) {
                draft.exercises[action.exerciseIdx].sets[currentSetIdx].weight =
                    sourceSet.weight;
                draft.exercises[action.exerciseIdx].sets[currentSetIdx].reps =
                    sourceSet.reps;
            }

            break;
        }
        case ActionType.AddExerciseNote:
            draft.exercises[action.exerciseIdx].notes.push(createNewNote());
            break;
        case ActionType.AddExercise:
            draft.exercises.push(action.exercise);
            break;
        case ActionType.RemoveExercise:
            draft.exercises.splice(action.exerciseIdx, 1);
            break;
        default:
            console.error("Unknown action type: ", action.type);
            break;
    }
});

const createNewSet = (): Set => ({
    id: generateGuid(),
    weight: "0",
    reps: "1",
    finishTime: undefined,
});

const createNewNote = (): Note => ({
    id: generateGuid(),
    value: "",
});
