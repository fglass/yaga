import { PermissionStatus } from "expo-modules-core";

import {
    requestDeviceMotionPermission,
    shouldHandleShake,
} from "../useShakeToUndo";

describe("requestDeviceMotionPermission", () => {
    it("does not request permission when permission cannot be asked again", async () => {
        const deviceMotion = {
            getPermissionsAsync: jest.fn().mockResolvedValue({
                status: PermissionStatus.DENIED,
                granted: false,
                canAskAgain: false,
                expires: "never",
            }),
            requestPermissionsAsync: jest.fn(),
        };

        await requestDeviceMotionPermission(deviceMotion);

        expect(deviceMotion.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it("requests permission when permission can be asked again", async () => {
        const deviceMotion = {
            getPermissionsAsync: jest.fn().mockResolvedValue({
                status: PermissionStatus.UNDETERMINED,
                granted: false,
                canAskAgain: true,
                expires: "never",
            }),
            requestPermissionsAsync: jest.fn().mockResolvedValue({
                status: PermissionStatus.GRANTED,
                granted: true,
                canAskAgain: true,
                expires: "never",
            }),
        };

        await requestDeviceMotionPermission(deviceMotion);

        expect(deviceMotion.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it("absorbs permission API failures so device motion can still subscribe", async () => {
        const deviceMotion = {
            getPermissionsAsync: jest
                .fn()
                .mockRejectedValue(new Error("permission unavailable")),
            requestPermissionsAsync: jest.fn(),
        };

        await expect(
            requestDeviceMotionPermission(deviceMotion)
        ).resolves.toBeUndefined();
    });
});

describe("shouldHandleShake", () => {
    const shakeMeasurement = {
        accelerationIncludingGravity: { x: 25, y: 0, z: 0 },
    } as Parameters<typeof shouldHandleShake>[1];

    it("handles a shake while the app is active", () => {
        expect(shouldHandleShake("active", shakeMeasurement)).toBe(true);
    });

    it.each(["background", "inactive"] as const)(
        "ignores a shake while the app is %s",
        (appState) => {
            expect(shouldHandleShake(appState, shakeMeasurement)).toBe(false);
        }
    );
});
