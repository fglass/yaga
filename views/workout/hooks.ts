import { useState, useEffect, useCallback, useRef } from "react";

export const DEFAULT_REST_DURATION_S = 90;

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

interface Props {
    onRestStart: (endTimeMs: number) => void;
    onRestCancel: () => void;
}

export const useTimers = ({ onRestStart, onRestCancel }: Props) => {
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
            const remainingRestSeconds = Math.floor(
                (restEndTimeRef.current - Date.now()) / 1000
            );
            setRemainingRestTimeS(
                clamp(remainingRestSeconds, -1, totalRestDurationS)
            );
        }, 250); // Run every 250ms to help with UI syncing
        return () => clearInterval(intervalId);
    }, [totalRestDurationS]);

    return {
        workoutStartTime: workoutStartTimeRef.current,
        workoutDurationS,
        remainingRestTimeS,
        totalRestDurationS,
        adjustRestTimer: useCallback(
            (deltaS: number) => {
                setTotalRestDurationS((prevTotal) =>
                    Math.max(prevTotal + deltaS, 0)
                );
                setRemainingRestTimeS((prevRemaining) => {
                    const base = Math.max(prevRemaining, 0);
                    const next = Math.max(base + deltaS, 0);
                    restEndTimeRef.current = Date.now() + next * 1000;
                    onRestStart(restEndTimeRef.current);
                    return next;
                });
            },
            [onRestStart]
        ),
        resetRestTimer: useCallback(() => {
            setTotalRestDurationS(DEFAULT_REST_DURATION_S);
            restEndTimeRef.current =
                Date.now() + DEFAULT_REST_DURATION_S * 1000;
            setRemainingRestTimeS(DEFAULT_REST_DURATION_S);
            onRestStart(restEndTimeRef.current);
        }, [onRestStart]),
        cancelRestTimer: useCallback(() => {
            restEndTimeRef.current = Date.now();
            setRemainingRestTimeS(-1);
            onRestCancel();
        }, [onRestCancel]),
    };
};
