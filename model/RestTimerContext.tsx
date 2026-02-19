import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";

const DEFAULT_REST_DURATION_S = 90;
const MIN_REST_DURATION_S = 30;

export type RestTimerState = {
    endTimeMs: number | null;
    totalDurationS: number;
};

type RestTimerContextValue = {
    getTimerState: (workoutId: string) => RestTimerState;
    setTimerState: (workoutId: string, state: RestTimerState) => void;
    clearTimerState: (workoutId: string) => void;
};

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const getDefaultState = (): RestTimerState => ({
    endTimeMs: null,
    totalDurationS: DEFAULT_REST_DURATION_S,
});

const getRemainingRestTimeS = (state: RestTimerState, nowMs: number) => {
    if (state.endTimeMs == null) {
        return -1;
    }

    const remainingRestSeconds = Math.floor((state.endTimeMs - nowMs) / 1000);
    return clamp(remainingRestSeconds, -1, state.totalDurationS);
};

export const RestTimerProvider = ({ children }: { children: React.ReactNode }) => {
    const stateRef = useRef<Record<string, RestTimerState>>({});
    const [, setVersion] = useState(0);

    const getTimerState = useCallback((workoutId: string): RestTimerState => {
        return stateRef.current[workoutId] ?? getDefaultState();
    }, []);

    const setTimerState = useCallback((workoutId: string, state: RestTimerState) => {
        stateRef.current = {
            ...stateRef.current,
            [workoutId]: state,
        };
        setVersion((prev) => prev + 1);
    }, []);

    const clearTimerState = useCallback((workoutId: string) => {
        if (!(workoutId in stateRef.current)) {
            return;
        }

        const nextState = { ...stateRef.current };
        delete nextState[workoutId];
        stateRef.current = nextState;
        setVersion((prev) => prev + 1);
    }, []);

    const value = useMemo(
        () => ({
            getTimerState,
            setTimerState,
            clearTimerState,
        }),
        [clearTimerState, getTimerState, setTimerState]
    );

    return (
        <RestTimerContext.Provider value={value}>
            {children}
        </RestTimerContext.Provider>
    );
};

export const useRestTimer = (params: {
    workoutId: string;
    isEnabled?: boolean;
    onRestStart: (endTimeMs: number) => void;
    onRestCancel: () => void;
}) => {
    const { workoutId, isEnabled = true, onRestStart, onRestCancel } = params;
    const context = useContext(RestTimerContext);

    if (!context) {
        throw new Error("useRestTimer must be used within RestTimerProvider");
    }

    const { getTimerState, setTimerState, clearTimerState } = context;
    const timerState = getTimerState(workoutId);
    const [nowMs, setNowMs] = useState(Date.now());

    React.useEffect(() => {
        if (!isEnabled) {
            return;
        }

        const intervalId = setInterval(() => {
            setNowMs(Date.now());
        }, 250);

        return () => clearInterval(intervalId);
    }, [isEnabled]);

    const remainingRestTimeS = getRemainingRestTimeS(timerState, nowMs);
    const totalRestDurationS = timerState.totalDurationS;

    const adjustRestTimer = useCallback(
        (deltaS: number) => {
            if (!isEnabled) {
                return;
            }

            const current = getTimerState(workoutId);
            const currentRemaining = getRemainingRestTimeS(current, Date.now());
            const nextTotalDurationS = Math.max(
                current.totalDurationS + deltaS,
                MIN_REST_DURATION_S
            );
            const baseRemaining = Math.max(currentRemaining, 0);
            const nextRemaining = Math.max(baseRemaining + deltaS, 0);
            const nextEndTimeMs = Date.now() + nextRemaining * 1000;
            setTimerState(workoutId, {
                endTimeMs: nextEndTimeMs,
                totalDurationS: nextTotalDurationS,
            });
            onRestStart(nextEndTimeMs);
        },
        [getTimerState, isEnabled, onRestStart, setTimerState, workoutId]
    );

    const resetRestTimer = useCallback(() => {
        if (!isEnabled) {
            return;
        }

        const current = getTimerState(workoutId);
        const nextEndTimeMs = Date.now() + current.totalDurationS * 1000;
        setTimerState(workoutId, {
            endTimeMs: nextEndTimeMs,
            totalDurationS: current.totalDurationS,
        });
        onRestStart(nextEndTimeMs);
    }, [getTimerState, isEnabled, onRestStart, setTimerState, workoutId]);

    const cancelRestTimer = useCallback(() => {
        if (!isEnabled) {
            return;
        }

        clearTimerState(workoutId);
        onRestCancel();
    }, [clearTimerState, isEnabled, onRestCancel, workoutId]);

    return {
        remainingRestTimeS,
        totalRestDurationS,
        adjustRestTimer,
        resetRestTimer,
        cancelRestTimer,
        clearRestTimerState: useCallback(() => {
            clearTimerState(workoutId);
        }, [clearTimerState, workoutId]),
    };
};
