import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
    SafeAreaProvider,
    initialWindowMetrics,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkoutNavProvider } from "../model/WorkoutNavContext";
import { Workout } from "../model/types";
import { initDatabase, useActiveWorkout } from "../model/database";
import { ActiveWorkoutMinimizeProvider } from "../model/ActiveWorkoutMinimizeContext";
import ActiveWorkoutMiniBar from "./ActiveWorkoutMiniBar";

// Run during module initialisation, before view renders
if (typeof window !== "undefined") {
    initDatabase();
}

const queryClient = new QueryClient();

const RootLayoutInner = () => {
    const router = useRouter();

    const { activeWorkout, isLoading: isActiveWorkoutLoading } =
        useActiveWorkout();
    const hasCheckedColdStart = useRef(false);

    // One-time cold-start check: if there's an active workout, navigate to it
    // TODO: test
    useEffect(() => {
        const decision = resolveColdStartRedirect({
            hasCheckedColdStart: hasCheckedColdStart.current,
            isActiveWorkoutLoading,
            activeWorkout,
        });

        if (!decision.shouldFinalizeCheck) {
            return;
        }

        hasCheckedColdStart.current = true;
        if (decision.route) {
            router.push(decision.route);
        }
    }, [activeWorkout, isActiveWorkoutLoading, router]);

    return (
        <GestureHandlerRootView style={styles.container}>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                    name="workout"
                    options={{
                        presentation: "card",
                        animation: "slide_from_right",
                        gestureEnabled: false,
                        contentStyle: {
                            backgroundColor: "#2A3135",
                        },
                    }}
                />
                <Stack.Screen
                    name="run"
                    options={{
                        presentation: "card",
                        animation: "slide_from_right",
                        gestureEnabled: false,
                        contentStyle: {
                            backgroundColor: "#2A3135",
                        },
                    }}
                />
            </Stack>
            <ActiveWorkoutMiniBar />
            {/* eslint-disable-next-line react/style-prop-object */}
            <StatusBar style="auto" />
        </GestureHandlerRootView>
    );
};

const RootLayout = () => {
    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <QueryClientProvider client={queryClient}>
                <WorkoutNavProvider>
                    <ActiveWorkoutMinimizeProvider>
                        <RootLayoutInner />
                    </ActiveWorkoutMinimizeProvider>
                </WorkoutNavProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
};

const resolveColdStartRedirect = (params: {
    hasCheckedColdStart: boolean;
    isActiveWorkoutLoading: boolean;
    activeWorkout: Workout | null;
}): {
    shouldFinalizeCheck: boolean;
    route: "/run" | "/workout?mode=active" | null;
} => {
    const { hasCheckedColdStart, isActiveWorkoutLoading, activeWorkout } =
        params;

    if (hasCheckedColdStart || isActiveWorkoutLoading) {
        return {
            shouldFinalizeCheck: false,
            route: null,
        };
    }

    if (activeWorkout?.type === "run") {
        return {
            shouldFinalizeCheck: true,
            route: "/run",
        };
    }

    if (activeWorkout) {
        return {
            shouldFinalizeCheck: true,
            route: "/workout?mode=active",
        };
    }

    return {
        shouldFinalizeCheck: true,
        route: null,
    };
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2A3135",
    },
});

export default RootLayout;
