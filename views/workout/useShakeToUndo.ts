import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import type { AppStateStatus } from "react-native";
import { DeviceMotion } from "expo-sensors";
import type { DeviceMotionMeasurement } from "expo-sensors";

type UseShakeToUndoParams = {
    enabled: boolean;
    onShake: () => void;
};

const DEVICE_MOTION_UPDATE_INTERVAL_MS = 100;
const SHAKE_ACCELERATION_THRESHOLD = 24;
const SHAKE_THROTTLE_MS = 1500;

export const useShakeToUndo = ({ enabled, onShake }: UseShakeToUndoParams) => {
    const onShakeRef = useRef(onShake);
    const lastShakeAtRef = useRef(0);

    useEffect(() => {
        onShakeRef.current = onShake;
    }, [onShake]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let subscriptionGeneration = 0;
        let subscription: { remove: () => void } | null = null;

        const unsubscribe = () => {
            subscriptionGeneration += 1;
            subscription?.remove();
            subscription = null;
        };

        const subscribe = async () => {
            unsubscribe();
            const generation = subscriptionGeneration;

            try {
                const isAvailable = await DeviceMotion.isAvailableAsync();
                if (
                    generation !== subscriptionGeneration ||
                    AppState.currentState !== "active" ||
                    !isAvailable
                ) {
                    return;
                }

                await requestDeviceMotionPermission();
                if (
                    generation !== subscriptionGeneration ||
                    AppState.currentState !== "active"
                ) {
                    return;
                }

                DeviceMotion.setUpdateInterval(
                    DEVICE_MOTION_UPDATE_INTERVAL_MS
                );
                subscription = DeviceMotion.addListener((measurement) => {
                    if (!shouldHandleShake(AppState.currentState, measurement)) {
                        return;
                    }

                    const now = Date.now();
                    if (now - lastShakeAtRef.current < SHAKE_THROTTLE_MS) {
                        return;
                    }

                    lastShakeAtRef.current = now;
                    onShakeRef.current();
                });
            } catch (error) {
                console.warn("Unable to enable shake to undo", error);
            }
        };

        const appStateSubscription = AppState.addEventListener(
            "change",
            (nextAppState) => {
                if (nextAppState === "active") {
                    void subscribe();
                    return;
                }

                unsubscribe();
            }
        );

        if (AppState.currentState === "active") {
            void subscribe();
        }

        return () => {
            appStateSubscription.remove();
            unsubscribe();
        };
    }, [enabled]);
};

type DeviceMotionPermissionApi = Pick<
    typeof DeviceMotion,
    "getPermissionsAsync" | "requestPermissionsAsync"
>;

export const requestDeviceMotionPermission = async (
    deviceMotion: DeviceMotionPermissionApi = DeviceMotion
) => {
    try {
        const permission = await deviceMotion.getPermissionsAsync();
        if (permission.granted || !permission.canAskAgain) {
            return;
        }

        await deviceMotion.requestPermissionsAsync();
    } catch {
        return;
    }
};

export const isShakeMotion = (
    measurement: DeviceMotionMeasurement
): boolean => {
    const acceleration = measurement.accelerationIncludingGravity;
    if (acceleration == null) {
        return false;
    }

    const magnitude = Math.sqrt(
        acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
    );

    return magnitude >= SHAKE_ACCELERATION_THRESHOLD;
};

export const shouldHandleShake = (
    appState: AppStateStatus,
    measurement: DeviceMotionMeasurement
): boolean => appState === "active" && isShakeMotion(measurement);
