import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { CompletedWorkout, Workout } from "../../model/types";
import { saveActiveWorkout, useDatabaseWriter } from "../../model/database";
import { generateGuid, withWarning } from "../../utils/util";
import { logAppleHealthWorkout } from "../../model/health";

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
    distanceKm: number;
    pacePerKm: string;
    canStart: boolean;
    onAdjustSpeed: (delta: number) => void;
    onStartRun: () => void;
    onFinishRun: () => Promise<void>;
    onCancelRun: () => Promise<void>;
}

const DEFAULT_SPEED_KMH = 11;

export const useRunViewModel = (props: Props): ViewModel => {
    const { onFinish, onCancel } = props;

    const initialDistanceKm = props.initialRun.distance ?? 0;
    const [run] = useState<Workout>({
        ...props.initialRun,
        type: "run",
        exercises: props.initialRun.exercises ?? [],
        notes: props.initialRun.notes ?? "",
        distance: initialDistanceKm,
    });

    const [speedKmh, setSpeedKmh] = useState<number>(DEFAULT_SPEED_KMH);
    const [speedInput, setSpeedInput] = useState(
        formatSpeed(DEFAULT_SPEED_KMH)
    );
    const [durationSeconds, setDurationSeconds] = useState(0);

    const [hasStarted, setHasStarted] = useState(false);
    const startTimeRef = useRef<number | null>(null);
    const [startTimestamp, setStartTimestamp] = useState<number>(
        props.initialRun.startTimestamp
    );

    const { completeWorkout } = useDatabaseWriter();

    useEffect(() => {
        const timerId = setInterval(() => {
            if (!hasStarted || startTimeRef.current == null) {
                return;
            }
            setDurationSeconds(
                Math.round((Date.now() - startTimeRef.current) / 1000)
            );
        }, 250);

        return () => clearInterval(timerId);
    }, [hasStarted]);

    const setSpeedValue = useCallback((value: number | undefined) => {
        if (value == null || isNaN(value) || value <= 0) {
            setSpeedInput("");
            setSpeedKmh(DEFAULT_SPEED_KMH);
            return;
        }

        const rounded = Math.round(value * 10) / 10;
        setSpeedInput(formatSpeed(rounded));
        setSpeedKmh(rounded);
    }, []);

    const onAdjustSpeed = useCallback(
        (delta: number) => {
            const current = speedKmh;
            const next = Math.max(0, current + delta);
            setSpeedValue(next);
            Haptics.selectionAsync();
        },
        [setSpeedValue, speedKmh]
    );

    const canStart = !hasStarted && speedKmh != null && speedKmh > 0;
    const canFinish = hasStarted && speedKmh != null && speedKmh > 0;

    const onStartRun = useCallback(() => {
        if (speedKmh == null || speedKmh <= 0) {
            return;
        }

        const startTime = Date.now();
        startTimeRef.current = startTime;
        setStartTimestamp(startTime);
        setHasStarted(true);
        setDurationSeconds(0);

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [speedKmh]);

    const incrementalDistanceKm =
        hasStarted && speedKmh != null && speedKmh > 0
            ? (speedKmh * durationSeconds) / 3600
            : 0;
    const distanceKm = initialDistanceKm + incrementalDistanceKm;
    const pacePerKm =
        speedKmh && speedKmh > 0 ? formatPace(3600 / speedKmh) : "—";

    useEffect(() => {
        saveActiveWorkout({
            ...run,
            startTimestamp: startTimestamp ?? run.startTimestamp,
            distance: distanceKm,
        });
    }, [saveActiveWorkout, run, distanceKm, startTimestamp]);

    const onFinishRun = useCallback(async () => {
        if (!canFinish) {
            return;
        }

        withWarning(
            async () => {
                const endDate = new Date();
                const completedRun: CompletedWorkout = {
                    ...run,
                    id: generateGuid(),
                    startTimestamp: startTimestamp,
                    endTimestamp: endDate.getTime(),
                    distance: distanceKm,
                };

                await completeWorkout(completedRun);

                await logAppleHealthWorkout({
                    startDate: new Date(startTimestamp),
                    endDate: endDate,
                    calories: 0, // Rely on Apple Health to track
                    workoutType: "run",
                });

                await onFinish();
                Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                );
            },
            "Finish Run",
            "Are you sure?"
        );
    }, [
        canFinish,
        completeWorkout,
        distanceKm,
        durationSeconds,
        speedKmh,
        onFinish,
        run,
    ]);

    const onCancelRun = useCallback(async () => {
        withWarning(
            async () => {
                await onCancel();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
            "Cancel Run",
            "Are you sure?"
        );
    }, [onCancel]);

    return {
        runName: run.name || "Run",
        speedInput,
        durationSeconds,
        canFinish,
        canStart,
        hasStarted,
        distanceKm,
        pacePerKm,
        onAdjustSpeed,
        onStartRun,
        onFinishRun,
        onCancelRun,
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
