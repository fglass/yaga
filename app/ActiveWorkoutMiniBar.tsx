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

const HISTORY_WORKOUT_BOTTOM_MIN_PX = 12;
const HISTORY_WORKOUT_BOTTOM_EXTRA_PX = 4;
const DEFAULT_BOTTOM_MIN_PX = 72;
const DEFAULT_BOTTOM_EXTRA_PX = 60;

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
    pathname: string;
    workoutMode?: string;
    bottomInset: number;
}) => {
    const { pathname, workoutMode, bottomInset } = params;
    const isHistoryWorkoutScreen =
        pathname === "/workout" && workoutMode === "history";

    if (isHistoryWorkoutScreen) {
        return Math.max(
            HISTORY_WORKOUT_BOTTOM_MIN_PX,
            bottomInset + HISTORY_WORKOUT_BOTTOM_EXTRA_PX
        );
    }

    return Math.max(
        DEFAULT_BOTTOM_MIN_PX,
        bottomInset + DEFAULT_BOTTOM_EXTRA_PX
    );
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
    const { remainingRestTimeS, totalRestDurationS } = useRestTimer({
        workoutId: activeWorkout?.id ?? "inactive-workout",
        isEnabled: isRestTimerEnabled,
        onRestStart,
        onRestCancel,
    });
    const isRestTimerActive = isRestTimerEnabled && remainingRestTimeS >= 0;
    const restProgress = isRestTimerActive
        ? Math.max(
              0,
              Math.min(1, remainingRestTimeS / Math.max(1, totalRestDurationS))
          )
        : 0;

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
                        pathname,
                        workoutMode: mode,
                        bottomInset: insets.bottom,
                    }),
                },
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.bar,
                    isRestTimerActive ? styles.restTimerBar : undefined,
                ]}
                onPress={() => {
                    void onResumeWorkout();
                }}
                activeOpacity={0.85}
            >
                {isRestTimerActive ? (
                    <View
                        style={[
                            styles.restTimerFill,
                            { width: `${restProgress * 100}%` },
                        ]}
                    />
                ) : null}
                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={1}>
                        {activeWorkout?.name ?? "Workout"}
                    </Text>
                    {isRestTimerActive ? (
                        <Text style={styles.restTimerText}>
                            {formatTime(remainingRestTimeS)}
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
        left: 20,
        right: 20,
    },
    bar: {
        backgroundColor: "rgba(88, 165, 249, 0.65)",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(88, 165, 249, 0.65)",
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
    },
    restTimerBar: {
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    restTimerFill: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        borderRadius: 14,
        backgroundColor: "rgba(77, 166, 255, 0.65)",
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
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
