import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { CompletedWorkout, Workout } from "../../model/types";
import { saveActiveWorkout, useDatabaseWriter } from "../../model/database";
import { generateGuid, withWarning } from "../../utils/util";
import { logAppleHealthWorkout } from "../../model/health";
import { logStravaWorkout } from "../../model/strava";
import { computeRunDistance } from "./calculations";

interface Props {
    initialRun: Workout;
    onFinish: () => Promise<void>;
    onCancel: () => Promise<void>;
}

interface ViewModel {
    runName: string;
    speedInput: string;
    durationSeconds: number;
    canFinish: boolean;
    hasStarted: boolean;
    isRunning: boolean;
    isPaused: boolean;
    distanceKm: number;
    pacePerKm: string;
    canToggleRun: boolean;
    onAdjustSpeed: (delta: number) => void;
    onToggleRun: () => void;
    onFinishRun: () => Promise<void>;
    onCancelRun: () => Promise<void>;
}

interface RunTimer {
    elapsedSeconds: number;
    hasStarted: boolean;
    isPaused: boolean;
    isRunning: boolean;
    start: (startTime?: number) => void;
    pause: () => void;
    resume: () => void;
    getElapsedSeconds: () => number;
}

const DEFAULT_SPEED_KMH = 11;

export const useRunViewModel = (props: Props): ViewModel => {
    const { onFinish, onCancel } = props;

    const [speedKmh, setSpeedKmh] = useState<number>(DEFAULT_SPEED_KMH);
    const [speedInput, setSpeedInput] = useState(
        formatSpeed(DEFAULT_SPEED_KMH)
    );

    const initialDistanceKm = props.initialRun.distance ?? 0;
    const distanceOffsetKmRef = useRef(initialDistanceKm);
    const distanceAnchorElapsedSecondsRef = useRef(0);
    const distanceKmRef = useRef(initialDistanceKm);

    const [run] = useState<Workout>({
        ...props.initialRun,
        type: "run",
        exercises: props.initialRun.exercises,
        notes: props.initialRun.notes ?? "",
        distance: initialDistanceKm,
    });

    const {
        elapsedSeconds,
        hasStarted,
        isPaused,
        isRunning,
        start: startTimer,
        pause: pauseTimer,
        resume: resumeTimer,
        getElapsedSeconds,
    } = useRunTimer();
    const [startTimestamp, setStartTimestamp] = useState<number>(
        props.initialRun.startTimestamp
    );

    const { completeWorkout } = useDatabaseWriter();

    const computeDistance = useCallback(
        (elapsedSecondsValue: number, speedKmhValue: number) => {
            return computeRunDistance({
                hasStarted,
                initialDistanceKm,
                speedKmh: speedKmhValue,
                elapsedSeconds: elapsedSecondsValue,
                distanceOffsetKm: distanceOffsetKmRef.current,
                distanceAnchorElapsedSeconds:
                    distanceAnchorElapsedSecondsRef.current,
            });
        },
        [hasStarted, initialDistanceKm]
    );

    const setSpeedValue = useCallback(
        (value: number | undefined) => {
            if (value == null || isNaN(value) || value <= 0) {
                setSpeedInput("");
                setSpeedKmh(DEFAULT_SPEED_KMH);
                return;
            }

            if (hasStarted) {
                const distanceNow = computeDistance(elapsedSeconds, speedKmh);
                distanceOffsetKmRef.current = distanceNow;
                distanceAnchorElapsedSecondsRef.current = elapsedSeconds;
            }

            const rounded = Math.round(value * 10) / 10;
            setSpeedInput(formatSpeed(rounded));
            setSpeedKmh(rounded);
        },
        [computeDistance, elapsedSeconds, hasStarted, speedKmh]
    );

    const onAdjustSpeed = useCallback(
        (delta: number) => {
            const current = speedKmh;
            const next = Math.max(0, current + delta);
            setSpeedValue(next);
            Haptics.selectionAsync();
        },
        [setSpeedValue, speedKmh]
    );

    const hasValidSpeed = speedKmh != null && speedKmh > 0;
    const canFinish = hasStarted && hasValidSpeed;
    const canToggleRun = hasStarted || hasValidSpeed;

    const startRun = useCallback(() => {
        if (!hasValidSpeed) {
            return;
        }
        const startTime = Date.now();
        startTimer(startTime);
        setStartTimestamp(startTime); // Override initial start timestamp
    }, [hasValidSpeed, startTimer]);

    const resumeRun = useCallback(() => {
        if (!hasValidSpeed) {
            return;
        }
        resumeTimer();
    }, [hasValidSpeed, resumeTimer]);

    const onToggleRun = useCallback(() => {
        if (!hasStarted) {
            startRun();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            return;
        }

        if (isRunning) {
            pauseTimer();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            return;
        }

        resumeRun();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [hasStarted, isRunning, pauseTimer, resumeRun, startRun]);

    const distanceKm = computeDistance(elapsedSeconds, speedKmh);
    distanceKmRef.current = distanceKm;

    const pacePerKm =
        speedKmh && speedKmh > 0 ? formatPace(3600 / speedKmh) : "—";

    useEffect(() => {
        saveActiveWorkout({
            ...run,
            startTimestamp,
            distance: distanceKm,
        });
    }, [run, distanceKm, startTimestamp]);

    const onFinishRun = useCallback(async () => {
        if (!canFinish) {
            return;
        }

        withWarning(
            async () => {
                pauseTimer();

                const finalElapsedSeconds = getElapsedSeconds();
                const finalDistanceKm = computeDistance(
                    finalElapsedSeconds,
                    speedKmh
                );
                distanceKmRef.current = finalDistanceKm;

                const endDate = new Date();
                const completedRun: CompletedWorkout = {
                    ...run,
                    id: generateGuid(),
                    startTimestamp,
                    endTimestamp: endDate.getTime(),
                    distance: finalDistanceKm,
                };

                const isStravaExported = await logStravaWorkout(completedRun);

                await completeWorkout(completedRun);
                await onFinish();

                if (!isStravaExported) {
                    await logAppleHealthWorkout({
                        startDate: new Date(startTimestamp),
                        endDate: endDate,
                        calories: 0, // Rely on Apple Health to track
                        workoutType: "run",
                    });
                }

                Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                );
            },
            { title: "Finish Run", message: "Are you sure?" }
        );
    }, [
        canFinish,
        computeDistance,
        completeWorkout,
        onFinish,
        run,
        speedKmh,
        startTimestamp,
        getElapsedSeconds,
        pauseTimer,
    ]);

    const onCancelRun = useCallback(async () => {
        withWarning(
            async () => {
                await onCancel();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
            {
                title: "Cancel Run",
                message: "Are you sure?",
                enabled: !hasStarted,
            }
        );
    }, [hasStarted, onCancel]);

    return {
        runName: run.name || "Run",
        speedInput,
        durationSeconds: elapsedSeconds,
        canFinish,
        canToggleRun,
        hasStarted,
        isRunning,
        isPaused,
        distanceKm,
        pacePerKm,
        onAdjustSpeed,
        onToggleRun,
        onFinishRun,
        onCancelRun,
    };
};

const useRunTimer = (): RunTimer => {
    const elapsedSecondsRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const getElapsedSeconds = useCallback(() => {
        if (startTimeRef.current == null) {
            return Math.round(elapsedSecondsRef.current);
        }

        return Math.round(
            elapsedSecondsRef.current +
                (Date.now() - startTimeRef.current) / 1000
        );
    }, []);

    useEffect(() => {
        const timerId = setInterval(() => {
            if (!hasStarted || startTimeRef.current == null) {
                return;
            }
            setElapsedSeconds(getElapsedSeconds());
        }, 250);

        return () => clearInterval(timerId);
    }, [getElapsedSeconds, hasStarted]);

    const start = useCallback((startTime?: number) => {
        startTimeRef.current = startTime ?? Date.now();
        setHasStarted(true);
        setIsPaused(false);
    }, []);

    const pause = useCallback(() => {
        if (!hasStarted) {
            return;
        }

        if (startTimeRef.current != null) {
            const elapsedSeconds =
                elapsedSecondsRef.current +
                (Date.now() - startTimeRef.current) / 1000;
            elapsedSecondsRef.current = elapsedSeconds;
            setElapsedSeconds(Math.round(elapsedSeconds));
            startTimeRef.current = null;
        }

        setIsPaused(true);
    }, [hasStarted]);

    const resume = useCallback(() => {
        startTimeRef.current = Date.now();
        setIsPaused(false);
    }, []);

    const isRunning = hasStarted && !isPaused && startTimeRef.current != null;

    return {
        elapsedSeconds,
        hasStarted,
        isPaused,
        isRunning,
        start,
        pause,
        resume,
        getElapsedSeconds,
    };
};

const formatPace = (secondsPerKm: number): string => {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")} /km`;
};

const formatSpeed = (speed: number): string =>
    (Math.round(speed * 10) / 10).toFixed(1);
