import React, { createContext, useCallback, useContext, useRef } from "react";
import { CompletedWorkout, Workout } from "./types";

type WorkoutNavData = Workout | CompletedWorkout;

type WorkoutNavContextValue = {
    setWorkout: (workout: WorkoutNavData) => void;
    consumeWorkout: () => WorkoutNavData | null;
};

const WorkoutNavContext = createContext<WorkoutNavContextValue | null>(null);

export const WorkoutNavProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const ref = useRef<WorkoutNavData | null>(null);

    const setWorkout = useCallback((workout: WorkoutNavData) => {
        ref.current = workout;
    }, []);

    const consumeWorkout = useCallback(() => {
        const workout = ref.current;
        ref.current = null;
        return workout;
    }, []);

    return (
        <WorkoutNavContext.Provider value={{ setWorkout, consumeWorkout }}>
            {children}
        </WorkoutNavContext.Provider>
    );
};

export const useWorkoutNav = (): WorkoutNavContextValue => {
    const context = useContext(WorkoutNavContext);
    if (!context) {
        throw new Error("useWorkoutNav must be used within WorkoutNavProvider");
    }
    return context;
};
