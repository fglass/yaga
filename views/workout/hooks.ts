import { useMemo, useState, useEffect, useCallback } from "react";

const DEFAULT_REST_DURATION_S = 20;

export const useTimers = () => {
    const workoutStartTime = useMemo(() => Date.now(), []);
    const [workoutDurationS, setWorkoutDurationS] = useState(0);

    const [restStartTime, setRestStartTime] = useState(
        Date.now() - DEFAULT_REST_DURATION_S * 1000
    );
    const [remainingRestTimeS, setRemainingRestTimeS] = useState(-1);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setWorkoutDurationS(
                Math.round((Date.now() - workoutStartTime) / 1000)
            );
            setRemainingRestTimeS(
                DEFAULT_REST_DURATION_S -
                    Math.floor((Date.now() - restStartTime) / 1000)
            );
        }, 1000);
        return () => clearInterval(intervalId);
    }, [workoutStartTime, restStartTime]); // TODO: remove rest depdendency

    return {
        workoutDurationS,
        remainingRestTimeS,
        resetRestTimer: useCallback(() => {
            setRestStartTime(Date.now());
            setRemainingRestTimeS(DEFAULT_REST_DURATION_S); // Skip effect wait
        }, []),
    };
};
