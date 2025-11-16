import { useCompletedWorkouts } from "../../model/database";
import { parseWorkoutEnd } from "../../util";

const getStartOfWeek = (reference: Date) => {
    const start = new Date(reference);
    start.setHours(0, 0, 0, 0);
    const distanceToSunday = start.getDay();
    start.setDate(start.getDate() - distanceToSunday);
    return start;
};

const addDays = (reference: Date, days: number) => {
    const date = new Date(reference);
    date.setDate(date.getDate() + days);
    return date;
};

export const useHomeViewModel = () => {
    const completedWorkouts = useCompletedWorkouts();

    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const previousWeekStart = addDays(startOfWeek, -7);
    const previousMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
    );
    const previousYearStart = new Date(now.getFullYear() - 1, 0, 1);

    const stats = completedWorkouts.reduce(
        (acc, workout) => {
            const completedDate = parseWorkoutEnd(workout.endTimestamp);

            if (!completedDate) {
                return acc;
            }

            if (completedDate >= startOfWeek) {
                acc.week.current += 1;
            } else if (
                completedDate >= previousWeekStart &&
                completedDate < startOfWeek
            ) {
                acc.week.previous += 1;
            }

            if (completedDate >= startOfMonth) {
                acc.month.current += 1;
            } else if (
                completedDate >= previousMonthStart &&
                completedDate < startOfMonth
            ) {
                acc.month.previous += 1;
            }

            if (completedDate >= startOfYear) {
                acc.year.current += 1;
            } else if (
                completedDate >= previousYearStart &&
                completedDate < startOfYear
            ) {
                acc.year.previous += 1;
            }

            return acc;
        },
        {
            week: { current: 0, previous: 0 },
            month: { current: 0, previous: 0 },
            year: { current: 0, previous: 0 },
        }
    );

    return {
        workoutsThisWeek: stats.week.current,
        workoutsLastWeek: stats.week.previous,
        workoutsThisMonth: stats.month.current,
        workoutsLastMonth: stats.month.previous,
        workoutsThisYear: stats.year.current,
        workoutsLastYear: stats.year.previous,
    };
};
