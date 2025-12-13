import { useState, useEffect, useCallback, useRef } from "react";

export const DEFAULT_REST_DURATION_S = 5;

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

interface UseTimersProps {
    onRestStart: () => void;
    onRestCancel: () => void;
}

export const useTimers = ({ onRestStart, onRestCancel }: UseTimersProps) => {
    const workoutStartTimeRef = useRef(Date.now());
    const [workoutDurationS, setWorkoutDurationS] = useState(0);

    const restEndTimeRef = useRef<number>(
        Date.now() - DEFAULT_REST_DURATION_S * 1000
    );
    const [remainingRestTimeS, setRemainingRestTimeS] = useState(-1);
    const [totalRestDurationS, setTotalRestDurationS] = useState(
        DEFAULT_REST_DURATION_S
    );

    useEffect(() => {
        const intervalId = setInterval(() => {
            setWorkoutDurationS(
                Math.round((Date.now() - workoutStartTimeRef.current) / 1000)
            );
            const remainingSeconds = Math.ceil(
                (restEndTimeRef.current - Date.now()) / 1000
            );
            setRemainingRestTimeS(
                clamp(remainingSeconds, -1, totalRestDurationS)
            );
        }, 1000);
        return () => clearInterval(intervalId);
    }, [totalRestDurationS]);

    return {
        workoutStartTime: workoutStartTimeRef.current,
        workoutDurationS,
        remainingRestTimeS,
        totalRestDurationS,
        restEndTimeMs: restEndTimeRef.current,
        adjustRestTimer: useCallback(
            (deltaS: number) => {
                console.log("adjusting rest timer", deltaS);
                setTotalRestDurationS((prevDuration) =>
                    Math.max(prevDuration + deltaS, 0)
                );
                setRemainingRestTimeS((prevRemaining) => {
                    const base = Math.max(prevRemaining, 0);
                    const next = Math.max(base + deltaS, 0);
                    restEndTimeRef.current = Date.now() + next * 1000;
                    return next;
                });
                onRestStart();
            },
            [onRestStart]
        ),
        resetRestTimer: useCallback(() => {
            console.log("reset rest timer");
            setTotalRestDurationS(DEFAULT_REST_DURATION_S);
            restEndTimeRef.current =
                Date.now() + DEFAULT_REST_DURATION_S * 1000;
            setRemainingRestTimeS(DEFAULT_REST_DURATION_S);
            onRestStart();
        }, [onRestStart]),
        cancelRestTimer: useCallback(() => {
            restEndTimeRef.current = Date.now();
            setRemainingRestTimeS(-1);
            onRestCancel();
        }, [onRestCancel]),
    };
};
