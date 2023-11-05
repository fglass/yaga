import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_REST_DURATION_S = 90;

export const useTimers = () => {
    const workoutStartTimeRef = useRef(Date.now());
    const [workoutDurationS, setWorkoutDurationS] = useState(0);

    const restStartTimeRef = useRef(
        Date.now() - DEFAULT_REST_DURATION_S * 1000 // Init before workout start
    );
    const [remainingRestTimeS, setRemainingRestTimeS] = useState(-1);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setWorkoutDurationS(
                Math.round((Date.now() - workoutStartTimeRef.current) / 1000)
            );
            setRemainingRestTimeS(
                DEFAULT_REST_DURATION_S -
                    Math.ceil((Date.now() - restStartTimeRef.current) / 1000) -
                    1
            );
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    return {
        workoutStartTime: workoutStartTimeRef.current,
        workoutDurationS,
        remainingRestTimeS,
        resetRestTimer: useCallback(() => {
            restStartTimeRef.current = Date.now();
            setRemainingRestTimeS(DEFAULT_REST_DURATION_S); // Skip interval wait
        }, []),
    };
};
