import {
    completedWorkoutFactory,
    createTestDb,
    exerciseDefFactory,
    exerciseFactory,
    fetchExerciseDefIdForExercise,
    fetchExerciseDefIds,
    fetchTemplateDefinition,
    seedDatabase,
    workoutTemplateFactory,
} from "../database.test.helpers";

describe("database exercise defs", () => {
    it("deleteExerciseDef reassigns exercises and removes from templates", async () => {
        await createTestDb(async (database, sqlite) => {
            // GIVEN
            const defA = { id: "def-a", def: exerciseDefFactory("Exercise A") };
            const defB = { id: "def-b", def: exerciseDefFactory("Exercise B") };

            const db = await sqlite.getDatabase();
            await seedDatabase(db, {
                exerciseDefs: [defA, defB],
                completedWorkouts: [
                    completedWorkoutFactory({
                        id: "workout-1",
                        exercises: [
                            exerciseFactory({
                                id: "exercise-1",
                                exerciseId: defA.id,
                            }),
                        ],
                    }),
                ],
                templates: [
                    workoutTemplateFactory({
                        id: "template-1",
                        exerciseIds: [defA.id, defB.id],
                    }),
                ],
            });

            // WHEN
            const deletedId = await database.deleteExerciseDef(defA.id);

            // THEN
            const remainingDefs = await fetchExerciseDefIds(db, [
                defA.id,
                defB.id,
            ]);
            expect(remainingDefs.map((row) => row.id)).toEqual([defB.id]);

            const deletedDef = await fetchExerciseDefIdForExercise(
                db,
                "exercise-1"
            );
            expect(deletedDef).toBe(deletedId);

            const template = await fetchTemplateDefinition(db, "template-1");
            expect(
                template.some((exercise) => exercise.exerciseId === defA.id)
            ).toBe(false);
        });
    });

    it("mergeExerciseDefs merges exercises", async () => {
        await createTestDb(async (database, sqlite) => {
            // GIVEN
            const defA = { id: "def-a", def: exerciseDefFactory("Exercise A") };
            const defB = { id: "def-b", def: exerciseDefFactory("Exercise B") };
            const defC = { id: "def-c", def: exerciseDefFactory("Exercise C") };

            const db = await sqlite.getDatabase();
            await seedDatabase(db, {
                exerciseDefs: [defA, defB, defC],
                completedWorkouts: [
                    completedWorkoutFactory({
                        id: "workout-2",
                        exercises: [
                            exerciseFactory({
                                id: "exercise-2",
                                exerciseId: defA.id,
                            }),
                        ],
                    }),
                ],
                templates: [
                    workoutTemplateFactory({
                        id: "template-2",
                        exerciseIds: [defA.id, defB.id, defC.id],
                    }),
                ],
            });

            // WHEN
            await database.mergeExerciseDefs(defB.id, [defA.id]);

            // THEN
            const mergedDef = await fetchExerciseDefIdForExercise(
                db,
                "exercise-2"
            );
            expect(mergedDef).toBe(defB.id);

            const template = await fetchTemplateDefinition(db, "template-2");
            const exerciseIds = template.map((exercise) => exercise.exerciseId);
            expect(exerciseIds.includes(defA.id)).toBe(false);
            expect(exerciseIds.filter((id) => id === defB.id)).toHaveLength(2);
            expect(exerciseIds.includes(defC.id)).toBe(true);
        });
    });

    it("mergeExerciseDefs updates single-exercise template", async () => {
        await createTestDb(async (database, sqlite) => {
            const defA = { id: "def-a", def: exerciseDefFactory("Exercise A") };
            const defB = { id: "def-b", def: exerciseDefFactory("Exercise B") };

            const db = await sqlite.getDatabase();
            await seedDatabase(db, {
                exerciseDefs: [defA, defB],
                templates: [
                    workoutTemplateFactory({
                        id: "template-3",
                        exerciseIds: [defA.id],
                    }),
                ],
            });

            await database.mergeExerciseDefs(defB.id, [defA.id]);

            const template = await fetchTemplateDefinition(db, "template-3");
            const exerciseIds = template.map((exercise) => exercise.exerciseId);
            expect(exerciseIds).toEqual([defB.id]);
        });
    });
});
