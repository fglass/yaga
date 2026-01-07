export type PeriodStats = {
    week: {
        current: number;
        previous: number;
    };
    month: {
        current: number;
        previous: number;
    };
    year: {
        current: number;
        previous: number;
    };
};

export const computePeriodStats = <
    T extends {
        startDate: Date;
        endDate: Date;
    }
>(
    workouts: T[],
    getValue: (workout: T) => number,
    referenceDate: Date = new Date()
): PeriodStats => {
    const {
        startOfWeek,
        startOfMonth,
        startOfYear,
        previousWeekStart,
        previousMonthStart,
        previousYearStart,
    } = getPeriodBoundaries(referenceDate);

    return workouts.reduce(
        (acc, workout) => {
            const completedDate = workout.endDate ?? workout.startDate;
            const rawValue = getValue(workout);
            const value = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;

            if (completedDate >= startOfWeek) {
                acc.week.current += value;
            } else if (
                completedDate >= previousWeekStart &&
                completedDate < startOfWeek
            ) {
                acc.week.previous += value;
            }

            if (completedDate >= startOfMonth) {
                acc.month.current += value;
            } else if (
                completedDate >= previousMonthStart &&
                completedDate < startOfMonth
            ) {
                acc.month.previous += value;
            }

            if (completedDate >= startOfYear) {
                acc.year.current += value;
            } else if (
                completedDate >= previousYearStart &&
                completedDate < startOfYear
            ) {
                acc.year.previous += value;
            }

            return acc;
        },
        {
            week: { current: 0, previous: 0 },
            month: { current: 0, previous: 0 },
            year: { current: 0, previous: 0 },
        }
    );
};

const getPeriodBoundaries = (reference: Date) => {
    const startOfWeek = getStartOfWeek(reference);
    const startOfMonth = new Date(
        reference.getFullYear(),
        reference.getMonth(),
        1
    );
    const startOfYear = new Date(reference.getFullYear(), 0, 1);
    const previousWeekStart = addDays(startOfWeek, -7);
    const previousMonthStart = new Date(
        reference.getFullYear(),
        reference.getMonth() - 1,
        1
    );
    const previousYearStart = new Date(reference.getFullYear() - 1, 0, 1);

    return {
        startOfWeek,
        startOfMonth,
        startOfYear,
        previousWeekStart,
        previousMonthStart,
        previousYearStart,
    };
};

const getStartOfWeek = (reference: Date) => {
    const start = new Date(reference);
    start.setHours(0, 0, 0, 0);
    const distanceToMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - distanceToMonday);
    return start;
};

const addDays = (reference: Date, days: number) => {
    const date = new Date(reference);
    date.setDate(date.getDate() + days);
    return date;
};
