import {
    completedWorkoutFactory,
    createTestDb,
    exerciseDefFactory,
    exerciseFactory,
    fetchExerciseDefIdForExercise,
    fetchExerciseDefIds,
    fetchTemplateDefinition,
    seedDatabase,
    setFactory,
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

describe("database templates", () => {
    it("deleteWorkoutTemplate removes the target template only", async () => {
        await createTestDb(async (database, sqlite) => {
            const db = await sqlite.getDatabase();
            await seedDatabase(db, {
                templates: [
                    workoutTemplateFactory({
                        id: "template-1",
                        exerciseIds: [],
                    }),
                    workoutTemplateFactory({
                        id: "template-2",
                        exerciseIds: [],
                    }),
                ],
            });

            await database.deleteWorkoutTemplate("template-1");

            const remainingTemplates = await database.fetchWorkoutTemplates();
            const remainingTemplateIds = remainingTemplates.map(
                (template) => template.id
            );
            expect(remainingTemplateIds).toContain("template-2");
            expect(remainingTemplateIds).not.toContain("template-1");
        });
    });
});

describe("database exercise sets", () => {
    it("fetches exercise sets before a specific timestamp", async () => {
        await createTestDb(async (database, sqlite) => {
            const defA = { id: "def-a", def: exerciseDefFactory("Exercise A") };
            const db = await sqlite.getDatabase();
            await seedDatabase(db, {
                exerciseDefs: [defA],
                completedWorkouts: [
                    completedWorkoutFactory({
                        id: "workout-1",
                        endTimestamp: 10,
                        exercises: [
                            exerciseFactory({
                                id: "exercise-1",
                                exerciseId: defA.id,
                                sets: [
                                    setFactory({
                                        id: "set-1",
                                        weight: "100",
                                        reps: "5",
                                    }),
                                ],
                            }),
                        ],
                    }),
                    completedWorkoutFactory({
                        id: "workout-2",
                        endTimestamp: 20,
                        exercises: [
                            exerciseFactory({
                                id: "exercise-2",
                                exerciseId: defA.id,
                                sets: [
                                    setFactory({
                                        id: "set-2",
                                        weight: "110",
                                        reps: "5",
                                    }),
                                ],
                            }),
                        ],
                    }),
                    completedWorkoutFactory({
                        id: "workout-3",
                        endTimestamp: 30,
                        exercises: [
                            exerciseFactory({
                                id: "exercise-3",
                                exerciseId: defA.id,
                                sets: [
                                    setFactory({
                                        id: "set-3",
                                        weight: "120",
                                        reps: "5",
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });

            const result =
                await database.fetchExerciseSetsFromCompletedWorkouts(
                    [defA.id],
                    1,
                    25
                );

            expect(result[defA.id]).toHaveLength(1);
            expect(result[defA.id][0].finishedAt).toBe(20);
            expect(result[defA.id][0].sets[0].weight).toBe("110");
        });
    });
});
