import { useEffect, useRef } from "react";
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

        let isSubscribed = true;
        let subscription: { remove: () => void } | null = null;

        const subscribe = async () => {
            try {
                const isAvailable = await DeviceMotion.isAvailableAsync();
                if (!isSubscribed || !isAvailable) {
                    return;
                }

                let permission = await DeviceMotion.getPermissionsAsync();
                if (!permission.granted && permission.canAskAgain) {
                    permission = await DeviceMotion.requestPermissionsAsync();
                }
                if (!isSubscribed || !permission.granted) {
                    return;
                }

                DeviceMotion.setUpdateInterval(
                    DEVICE_MOTION_UPDATE_INTERVAL_MS
                );
                subscription = DeviceMotion.addListener((measurement) => {
                    const now = Date.now();
                    if (now - lastShakeAtRef.current < SHAKE_THROTTLE_MS) {
                        return;
                    }
                    if (!isShakeMotion(measurement)) {
                        return;
                    }

                    lastShakeAtRef.current = now;
                    onShakeRef.current();
                });
            } catch (error) {
                console.warn("Unable to enable shake to undo", error);
            }
        };

        void subscribe();

        return () => {
            isSubscribed = false;
            subscription?.remove();
        };
    }, [enabled]);
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
