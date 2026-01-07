import { computePeriodStats } from "../periodStats";

describe("computePeriodStats", () => {
    it("sums distances into the expected periods", () => {
        const referenceDate = new Date(2025, 1, 15, 12, 0, 0);
        const workouts = [
            {
                startDate: new Date(2025, 1, 12, 7, 30, 0),
                endDate: new Date(2025, 1, 12, 8, 0, 0),
                distance: 5,
            },
            {
                startDate: new Date(2025, 1, 5, 6, 45, 0),
                endDate: new Date(2025, 1, 5, 7, 15, 0),
                distance: 3,
            },
            {
                startDate: new Date(2025, 1, 2, 18, 0, 0),
                endDate: new Date(2025, 1, 2, 18, 30, 0),
                distance: 2,
            },
            {
                startDate: new Date(2025, 0, 20, 9, 0, 0),
                endDate: new Date(2025, 0, 20, 9, 30, 0),
                distance: 4,
            },
            {
                startDate: new Date(2024, 10, 20, 9, 0, 0),
                endDate: new Date(2024, 10, 20, 9, 30, 0),
                distance: 7,
            },
        ];

        const stats = computePeriodStats(
            workouts,
            (workout) => workout.distance ?? 0,
            referenceDate
        );

        expect(stats.week.current).toBeCloseTo(5, 6);
        expect(stats.week.previous).toBeCloseTo(3, 6);
        expect(stats.month.current).toBeCloseTo(10, 6);
        expect(stats.month.previous).toBeCloseTo(4, 6);
        expect(stats.year.current).toBeCloseTo(14, 6);
        expect(stats.year.previous).toBeCloseTo(7, 6);
    });

});
