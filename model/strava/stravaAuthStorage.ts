import * as SecureStore from "expo-secure-store";
import { StravaToken } from "./strava.types";

const STRAVA_AUTH_STORAGE_KEY = "stravaAuthToken";

export const loadStravaToken = async (): Promise<StravaToken | null> => {
    try {
        const stored = await SecureStore.getItemAsync(STRAVA_AUTH_STORAGE_KEY);
        if (!stored) {
            return null;
        }

        const parsed = JSON.parse(stored) as Partial<StravaToken>;
        if (!parsed.accessToken) {
            return null;
        }

        return {
            accessToken: String(parsed.accessToken),
            refreshToken: parsed.refreshToken
                ? String(parsed.refreshToken)
                : undefined,
            expiresAt:
                parsed.expiresAt != null ? Number(parsed.expiresAt) : undefined,
        };
    } catch (error) {
        console.warn("Strava auth storage read failed", error);
        return null;
    }
};

export const saveStravaToken = async (token: StravaToken): Promise<void> => {
    if (!token?.accessToken) {
        await clearStravaToken();
        return;
    }

    try {
        await SecureStore.setItemAsync(
            STRAVA_AUTH_STORAGE_KEY,
            JSON.stringify({
                accessToken: token.accessToken,
                refreshToken: token.refreshToken,
                expiresAt: token.expiresAt,
            })
        );
    } catch (error) {
        console.warn("Strava auth storage write failed", error);
    }
};

export const clearStravaToken = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(STRAVA_AUTH_STORAGE_KEY);
    } catch (error) {
        console.warn("Strava auth storage clear failed", error);
    }
};
