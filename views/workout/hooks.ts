import { useState, useEffect, useCallback, useRef } from "react";

export const DEFAULT_REST_DURATION_S = 90;

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

interface Props {
    onRestStart: (endTimeMs: number) => void;
    onRestCancel: () => void;
    initialStartTimeMs?: number;
    isEnabled?: boolean;
}

export const useTimers = ({
    onRestStart,
    onRestCancel,
    initialStartTimeMs,
    isEnabled = true,
}: Props) => {
    const workoutStartTimeRef = useRef(initialStartTimeMs ?? Date.now());
    const [workoutDurationS, setWorkoutDurationS] = useState(0);

    const restEndTimeRef = useRef<number>(
        Date.now() - DEFAULT_REST_DURATION_S * 1000
    );
    const [remainingRestTimeS, setRemainingRestTimeS] = useState(-1);
    const [totalRestDurationS, setTotalRestDurationS] = useState(
        DEFAULT_REST_DURATION_S
    );

    useEffect(() => {
        if (!isEnabled) {
            return;
        }
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
    }, [isEnabled, totalRestDurationS]);

    return {
        workoutStartTime: workoutStartTimeRef.current,
        workoutDurationS,
        remainingRestTimeS,
        totalRestDurationS,
        adjustRestTimer: useCallback(
            (deltaS: number) => {
                if (!isEnabled) {
                    return;
                }
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
            [isEnabled, onRestStart]
        ),
        resetRestTimer: useCallback(() => {
            if (!isEnabled) {
                return;
            }
            restEndTimeRef.current = Date.now() + totalRestDurationS * 1000;
            setRemainingRestTimeS(totalRestDurationS);
            onRestStart(restEndTimeRef.current);
        }, [isEnabled, onRestStart, totalRestDurationS]),
        cancelRestTimer: useCallback(() => {
            if (!isEnabled) {
                return;
            }
            restEndTimeRef.current = Date.now();
            setRemainingRestTimeS(-1);
            onRestCancel();
        }, [isEnabled, onRestCancel]),
    };
};
