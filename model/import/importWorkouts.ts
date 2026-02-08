import { generateGuid } from "../../utils/guid";
import { normalizeExerciseName } from "./import.helpers";
import {
    ExerciseMapping,
    ImportData,
    ImportSummary,
} from "./import.types";
import {
    completeWorkout,
    createExerciseDef,
    fetchCompletedWorkoutKeys,
} from "../database";
import { CompletedWorkout, Exercise, Set as WorkoutSet } from "../types";

export const importWorkouts = async (
    data: ImportData,
    mapping: Record<string, ExerciseMapping>,
    importedBy: string
): Promise<ImportSummary> => {
    const startTime = Date.now();
    
    const existingWorkoutKeys = new Set(
        await fetchCompletedWorkoutKeys()
    );

    const createdExerciseDefs = new Map<string, string>();

    let workoutsAdded = 0;
    let workoutsSkipped = 0;
    let newExerciseDefs = 0;

    const importStamp = `${importedBy}@${new Date().toISOString()}`;

    for (const workout of data.workouts) {
        if (existingWorkoutKeys.has(workout.key)) {
            workoutsSkipped += 1;
            continue;
        }

        const exercises: Exercise[] = [];
        for (const exercise of workout.exercises) {
            const exerciseMapping = mapping[exercise.name];
            if (!exerciseMapping || exerciseMapping.type === "skip") {
                continue;
            }

            let exerciseDefId: string | null = null;
            if (exerciseMapping.type === "existing") {
                exerciseDefId = exerciseMapping.exerciseDefId;
            } else if (exerciseMapping.type === "create") {
                const cacheKey = normalizeExerciseName(exerciseMapping.name);
                const existingId = createdExerciseDefs.get(cacheKey);
                if (existingId) {
                    exerciseDefId = existingId;
                } else {
                    exerciseDefId = await createExerciseDef({
                        name: exerciseMapping.name,
                        category: exerciseMapping.category,
                    });
                    createdExerciseDefs.set(cacheKey, exerciseDefId);
                    newExerciseDefs += 1;
                }
            }

            if (!exerciseDefId) {
                continue;
            }

            const sets: WorkoutSet[] = exercise.sets.map((set) => ({
                id: generateGuid(),
                weight: set.weight ?? "",
                reps: set.reps ?? "",
                type: "default",
                finishTime: workout.finishedAt,
            }));

            exercises.push({
                id: generateGuid(),
                exerciseId: exerciseDefId,
                notes: [],
                sets,
            });
        }

        const completedWorkout: CompletedWorkout = {
            id: generateGuid(),
            name: workout.name,
            notes: workout.workoutNotes ?? "",
            type: "strength",
            metadata: {
                importedBy: importStamp,
            },
            startTimestamp: workout.startedAt,
            endTimestamp: workout.finishedAt,
            exercises,
        };

        await completeWorkout(completedWorkout);
        workoutsAdded += 1;
    }

    console.log(`Workouts imported in ${Date.now() - startTime}ms`);
    return {
        workoutsAdded,
        workoutsSkipped,
        newExerciseDefs,
    };
};
