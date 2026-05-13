import React, { useCallback, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGlobalSearchParams, usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueryKey, useActiveWorkout } from "../model/database";
import { useRestTimer } from "../model/context/RestTimerContext";
import { formatTime } from "../utils/util";

const REST_TIMER_BOTTOM_OFFSET_PX = 50;
const NON_WORKOUT_BOTTOM_LIFT_PX = 10;
const REST_TIMER_HORIZONTAL_INSET_PX = 28;

export const shouldShowActiveWorkoutMiniBar = (params: {
    isMinimized: boolean;
    hasActiveWorkout: boolean;
    pathname: string;
    workoutMode?: string;
}) => {
    const { isMinimized, hasActiveWorkout, pathname, workoutMode } = params;
    if (!isMinimized || !hasActiveWorkout) {
        return false;
    }

    if (pathname === "/run") {
        return false;
    }

    if (pathname === "/workout") {
        return workoutMode === "history";
    }

    return true;
};

const getActiveWorkoutMiniBarBottomOffset = (params: {
    bottomInset: number;
    pathname: string;
}) => {
    const { bottomInset, pathname } = params;
    const routeLift = pathname === "/workout" ? 0 : NON_WORKOUT_BOTTOM_LIFT_PX;

    return bottomInset + REST_TIMER_BOTTOM_OFFSET_PX + routeLift;
};

const ActiveWorkoutMiniBar = () => {
    const {
        activeWorkout,
        isMinimized,
        restore: restoreActiveWorkout,
    } = useActiveWorkout();
    const router = useRouter();
    const queryClient = useQueryClient();
    const pathname = usePathname();
    const { mode } = useGlobalSearchParams<{ mode?: string }>();
    const insets = useSafeAreaInsets();

    const onRestStart = useCallback(() => {}, []);
    const onRestCancel = useCallback(() => {}, []);
    const isRestTimerEnabled =
        activeWorkout?.type !== "run" && activeWorkout?.id != null;
    const { hasActiveRestTimer, remainingRestTimeS, totalRestDurationS } =
        useRestTimer({
            workoutId: activeWorkout?.id ?? "inactive-workout",
            isEnabled: isRestTimerEnabled,
            onRestStart,
            onRestCancel,
        });
    const isRestTimerOvertime =
        isRestTimerEnabled && hasActiveRestTimer && remainingRestTimeS < 0;
    const showRestTimer = isRestTimerEnabled && hasActiveRestTimer;
    const barProgress = showRestTimer && !isRestTimerOvertime
        ? Math.max(
              0,
              Math.min(1, remainingRestTimeS / Math.max(1, totalRestDurationS))
          )
        : 1;

    // If there is no active workout, clear any stale minimized flag
    useEffect(() => {
        if (!activeWorkout && isMinimized) {
            restoreActiveWorkout();
        }
    }, [activeWorkout, isMinimized, restoreActiveWorkout]);

    const isVisible = shouldShowActiveWorkoutMiniBar({
        isMinimized,
        hasActiveWorkout: activeWorkout != null,
        pathname,
        workoutMode: mode,
    });

    if (!isVisible) {
        return null;
    }

    const onResumeWorkout = async () => {
        if (activeWorkout == null) {
            console.error("Active workout is unexpectedly null");
            return;
        }

        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        await queryClient.invalidateQueries({
            queryKey: [QueryKey.ActiveWorkout],
        });
        await queryClient.refetchQueries({
            queryKey: [QueryKey.ActiveWorkout],
            type: "active",
        });

        if (activeWorkout.type === "run") {
            router.replace("/run");
            return;
        }
        router.replace("/workout?mode=active");
    };

    return (
        <View
            pointerEvents="box-none"
            style={[
                styles.container,
                {
                    bottom: getActiveWorkoutMiniBarBottomOffset({
                        bottomInset: insets.bottom,
                        pathname,
                    }),
                    paddingHorizontal: REST_TIMER_HORIZONTAL_INSET_PX,
                },
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.bar,
                    isRestTimerOvertime ? styles.overtimeBar : undefined,
                ]}
                onPress={() => {
                    void onResumeWorkout();
                }}
                activeOpacity={0.85}
            >
                <View style={styles.barTrack} pointerEvents="none">
                    <View
                        style={[
                            styles.barFill,
                            isRestTimerOvertime
                                ? styles.overtimeFill
                                : undefined,
                            { width: `${barProgress * 100}%` },
                        ]}
                    />
                </View>
                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={1}>
                        {activeWorkout?.name ?? "Workout"}
                    </Text>
                    {showRestTimer ? (
                        <Text style={styles.restTimerText}>
                            {formatTime(Math.abs(remainingRestTimeS))}
                        </Text>
                    ) : (
                        <Ionicons name="play" size={16} color="white" />
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 0,
        right: 0,
    },
    bar: {
        height: 48,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        padding: 3,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
    },
    overtimeBar: {
        borderColor: "rgba(255, 255, 255, 0.16)",
    },
    barTrack: {
        position: "absolute",
        borderRadius: 999,
        top: 3,
        right: 3,
        bottom: 3,
        left: 3,
        overflow: "hidden",
    },
    barFill: {
        height: "100%",
        borderRadius: 999,
        backgroundColor: "rgba(77, 166, 255, 0.65)",
    },
    overtimeFill: {
        backgroundColor: "rgba(235, 87, 87, 0.78)",
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        minHeight: 40,
        paddingHorizontal: 13,
        zIndex: 1,
    },
    title: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
        flex: 1,
        marginRight: 12,
    },
    restTimerText: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
});

export default ActiveWorkoutMiniBar;
