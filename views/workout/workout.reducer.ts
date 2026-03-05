import produce from "immer";
import { Note, Set, SetType, Workout } from "../../model/types";
import { generateGuid } from "../../utils/guid";

type Action = {
    type: ActionType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

export enum ActionType {
    ChangeWorkoutName = "change-workout-name",
    ChangeWorkoutNotes = "change-workout-notes",
    ChangeExerciseNote = "change-exercise-note",
    ChangeWeight = "change-weight",
    ChangeReps = "change-reps",
    ChangeSetType = "change-set-type",
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
    SyncWorkout = "sync-workout",
}

export const workoutProducer = produce((draft: Workout, action: Action) => {
    switch (action.type) {
        case ActionType.ChangeWorkoutName:
            draft.name = action.name;
            break;
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
        case ActionType.ChangeSetType:
            draft.exercises[action.exerciseIdx].sets[action.setIdx].type =
                action.setType as SetType;
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

            if (action.prefillSet != null) {
                newSet.weight = action.prefillSet.weight;
                newSet.reps = action.prefillSet.reps;
                newSet.type = action.prefillSet.type;
            } else if (lastSet !== undefined) {
                newSet.weight = lastSet.weight;
                newSet.reps = lastSet.reps;
                newSet.type = lastSet.type;
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
                draft.exercises[action.exerciseIdx].sets[currentSetIdx].type =
                    sourceSet.type;
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
        case ActionType.SyncWorkout:
            // Immer allows returning a new state to replace the draft
            return action.workout as Workout;
        default:
            console.error("Unknown action type: ", action.type);
            break;
    }
}) as (state: Workout, action: Action) => Workout;

const createNewSet = (): Set => ({
    id: generateGuid(),
    weight: "",
    reps: "",
    type: "default",
    finishTime: undefined,
});

const createNewNote = (): Note => ({
    id: generateGuid(),
    value: "",
});
