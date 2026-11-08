import { buildImportData, parseStrongCsv } from "../importStrongCsv";
import { normalizeExerciseName } from "../import.helpers";

const SAMPLE_CSV = `Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE
2022-12-30 11:34:35,Legs,33m,Single Leg Extension,1,66.0,14.0,0,0.0,,First workout,
2022-12-30 11:34:35,Legs,33m,Single Leg Extension,Rest Timer,0,0.0,0,90.0,,First workout,
2022-12-30 11:34:35,Legs,33m,Single Leg Extension,2,66.0,13.0,0,0.0,,First workout,
2022-12-30 11:34:35,Legs,33m,Single Leg Extension,Rest Timer,0,0.0,0,90.0,,First workout,
2022-12-30 11:34:35,Legs,33m,Chin Up,1,0,8,0,0.0,,First workout,
2022-12-31 09:10:00,Upper,25m,Incline Bench Press,1,60.0,8,0,0.0,,Second workout,
2022-12-31 09:10:00,Upper,25m,Seated Row,1,55.0,10,0,0.0,,Second workout,
`;

describe("importStrongCsv", () => {
    it("parses CSV correctly", () => {
        const parseResult = parseStrongCsv(SAMPLE_CSV);
        expect(parseResult.errors).toEqual([]);
        expect(parseResult.rows).toHaveLength(5);

        const data = buildImportData(parseResult.rows);
        expect(data.workoutCount).toBe(2);
        expect(data.exerciseNames).toEqual([
            "Single Leg Extension",
            "Chin Up",
            "Incline Bench Press",
            "Seated Row",
        ]);
        expect(data.workouts[0].exercises).toEqual([
            {
                name: "Single Leg Extension",
                sets: [
                    {
                        position: 0,
                        weight: "66.0",
                        reps: "14.0",
                    },
                    {
                        position: 1,
                        weight: "66.0",
                        reps: "13.0",
                    },
                ],
            },
            {
                name: "Chin Up",
                sets: [
                    {
                        position: 0,
                        weight: "0",
                        reps: "8",
                    },
                ],
            },
        ]);
        expect(data.workouts[1].exercises).toEqual([
            {
                name: "Incline Bench Press",
                sets: [
                    {
                        position: 0,
                        weight: "60.0",
                        reps: "8",
                    },
                ],
            },
            {
                name: "Seated Row",
                sets: [
                    {
                        position: 0,
                        weight: "55.0",
                        reps: "10",
                    },
                ],
            },
        ]);
    });

    it.each([
        ["Lat Pulldown (Close)", "lat pulldown close"],
        ["Cable_Crossover-Low", "cable crossover low"],
        ["  Bench   Press  ", "bench press"],
        ["Tricep Extension.", "tricep extension"],
    ])("normalizes exercise names for %s", (input, expected) => {
        expect(normalizeExerciseName(input)).toBe(expected);
    });
});
