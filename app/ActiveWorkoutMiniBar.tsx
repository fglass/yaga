import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueryKey, useActiveWorkout } from "../model/database";

const shouldShowActiveWorkoutMiniBar = (params: {
    isMinimized: boolean;
    hasActiveWorkout: boolean;
    pathname: string;
}) => {
    const { isMinimized, hasActiveWorkout, pathname } = params;
    if (!isMinimized || !hasActiveWorkout) {
        return false;
    }

    return pathname !== "/workout" && pathname !== "/run";
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
    const insets = useSafeAreaInsets();

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
            router.push("/run");
            return;
        }
        router.push("/workout?mode=active");
    };

    return (
        <View
            pointerEvents="box-none"
            style={[
                styles.container,
                { bottom: Math.max(72, insets.bottom + 60) },
            ]}
        >
            <TouchableOpacity
                style={styles.bar}
                onPress={() => {
                    void onResumeWorkout();
                }}
                activeOpacity={0.85}
            >
                <Text style={styles.title} numberOfLines={1}>
                    {activeWorkout?.name ?? "Workout"}
                </Text>
                <Ionicons name="play" size={16} color="white" />
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
        backgroundColor: "#58A5F9",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#58A5F9",
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
        flex: 1,
        marginRight: 12,
    },
});

export default ActiveWorkoutMiniBar;
