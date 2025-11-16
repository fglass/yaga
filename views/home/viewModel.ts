import { useCompletedWorkouts } from "../../model/database";

export const useHomeViewModel = () => {
    const completedWorkouts = useCompletedWorkouts();

    const totalCompletedSets = completedWorkouts.reduce((count, workout) => {
        return (
            count +
            workout.exercises.reduce(
                (exerciseCount, exercise) =>
                    exerciseCount +
                    exercise.sets.filter(
                        (set) => set.finishTime !== undefined
                    ).length,
                0
            )
        );
    }, 0);

    return {
        totalCompletedWorkouts: completedWorkouts.length,
        totalCompletedSets,
    };
};
