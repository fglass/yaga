import { Linking } from "react-native";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { CompletedWorkout } from "../types";
import {
    StravaActivityPayload,
    StravaConfig,
    StravaToken,
} from "./strava.types";
import { fetchWithTimeout, getWorkoutDurationSeconds } from "../../utils/util";
import { generateGuid } from "../../utils/guid";
import {
    clearStravaToken,
    loadStravaToken,
    saveStravaToken,
} from "./stravaAuthStorage";

const STRAVA_AUTH_SCOPE = ["activity:write", "read"];
const STRAVA_APP_AUTH_URL = "strava://oauth/mobile/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITY_URL = "https://www.strava.com/api/v3/activities";
const STRAVA_ACTIVITY_PAGE_URL = "https://www.strava.com/activities";
const STRAVA_REQUEST_TIMEOUT_MS = 10_000;
const STRAVA_AUTH_REDIRECT_TIMEOUT_MS = 30_000;

let isStravaLoggingEnabled = true;

export const getStravaLoggingEnabled = () => isStravaLoggingEnabled;

export const setStravaLoggingEnabled = (enabled: boolean) => {
    isStravaLoggingEnabled = enabled;
};

export const logStravaWorkout = async (
    workout: CompletedWorkout
): Promise<string | null> => {
    if (!isStravaLoggingEnabled) {
        console.log("Strava logging is disabled");
        return null;
    }

    if (workout.type !== "run" || workout.distance == null) {
        console.error("Invalid workout for Strava upload", workout);
        return null;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
        return null;
    }

    const durationSeconds = getWorkoutDurationSeconds(
        workout.startTimestamp,
        workout.endTimestamp
    );
    const distanceMeters = Math.max(0, workout.distance * 1000);
    const payload: StravaActivityPayload = {
        name: "Indoor Run",
        type: "Run",
        sport_type: "Run",
        start_date_local: formatStravaLocalTimestamp(workout.startTimestamp),
        elapsed_time: Math.max(1, durationSeconds),
        description: "Logged by Yaga 💨",
        distance: distanceMeters,
    };

    try {
        const response = await fetchWithTimeout(
            STRAVA_ACTIVITY_URL,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            },
            STRAVA_REQUEST_TIMEOUT_MS
        );

        if (!response.ok) {
            const error = await safeJson(response);
            console.warn("Strava activity upload failed", error);
            return null;
        }

        const data = (await safeJson(response)) as { id?: number | string };
        return parseStravaActivityId(data.id);
    } catch (error) {
        if (isAbortError(error)) {
            console.warn(
                `Strava activity upload timed out after ${STRAVA_REQUEST_TIMEOUT_MS}ms`
            );
            return null;
        }
        console.warn("Strava activity upload failed", error);
        return null;
    }
};

export const getStravaActivityUrl = (activityId: string): string =>
    `${STRAVA_ACTIVITY_PAGE_URL}/${encodeURIComponent(activityId)}`;

export const openStravaActivity = async (
    activityId: string
): Promise<boolean> => {
    try {
        await Linking.openURL(getStravaActivityUrl(activityId));
        return true;
    } catch (error) {
        console.warn("Failed to open Strava activity", error);
        return false;
    }
};

export const getAccessToken = async (): Promise<string | null> => {
    const config = getStravaConfig();
    if (!config.clientId || !config.clientSecret || !config.redirectScheme) {
        console.warn("Strava config missing; skipping upload");
        return null;
    }

    const storedToken = await loadStravaToken();
    if (isTokenValid(storedToken)) {
        console.log("Using stored Strava token...");
        return storedToken?.accessToken ?? null;
    }

    if (storedToken?.refreshToken) {
        console.log("Refreshing Strava token...");
        const refreshed = await refreshStravaToken(
            config,
            storedToken.refreshToken
        );

        if (refreshed) {
            await saveStravaToken(refreshed);
            return refreshed.accessToken;
        }

        await clearStravaToken();
    }

    console.log("Fetching Strava authorisation code...");
    const authResult = await authenticateStrava(config);
    if (!authResult) {
        return null;
    }

    console.log("Exchanging Strava authorisation code...");
    const exchanged = await exchangeStravaCode(config, authResult.code);
    if (!exchanged) {
        return null;
    }

    console.log("Saving Strava token...");
    await saveStravaToken(exchanged);

    return exchanged.accessToken;
};

const authenticateStrava = async (
    config: StravaConfig
): Promise<{ code: string } | null> => {
    const state = generateGuid();
    const redirectUri = AuthSession.makeRedirectUri({
        scheme: config.redirectScheme,
        path: "com.expench.yaga/redirect",
    });

    const authParams = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        approval_prompt: "auto",
        scope: STRAVA_AUTH_SCOPE.join(","),
        state,
    });

    const appAuthUrl = `${STRAVA_APP_AUTH_URL}?${authParams.toString()}`;

    const canOpenApp = await Linking.canOpenURL(appAuthUrl);

    if (!canOpenApp) {
        alert("Strava is not installed");
        return null;
    }

    const redirectUrl = await openStravaApp(appAuthUrl, config.redirectScheme);

    if (!redirectUrl) {
        return null;
    }

    const params = parseUrlParams(redirectUrl);
    if (!params.code || (params.state && params.state !== state)) {
        if (params.error) {
            console.warn("Strava auth error", params.error);
        }
        return null;
    }

    return { code: params.code };
};

const openStravaApp = async (
    authUrl: string,
    redirectScheme: string
): Promise<string | null> => {
    return waitForRedirect(async () => {
        await Linking.openURL(authUrl);
    }, redirectScheme);
};

const exchangeStravaCode = async (
    config: StravaConfig,
    code: string
): Promise<StravaToken | null> => {
    return requestStravaToken({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
    });
};

const refreshStravaToken = async (
    config: StravaConfig,
    refreshToken: string
): Promise<StravaToken | null> => {
    return requestStravaToken({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
    });
};

const requestStravaToken = async (
    payload: Record<string, string>
): Promise<StravaToken | null> => {
    try {
        const response = await fetchWithTimeout(
            STRAVA_TOKEN_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            },
            STRAVA_REQUEST_TIMEOUT_MS
        );

        if (!response.ok) {
            const error = await safeJson(response);
            console.warn("Strava token exchange failed", error);
            return null;
        }

        const data = (await response.json()) as {
            access_token?: string;
            refresh_token?: string;
            expires_at?: number;
        };

        if (!data.access_token) {
            console.warn("Strava token exchange missing access token");
            return null;
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_at,
        };
    } catch (error) {
        if (isAbortError(error)) {
            console.warn(
                `Strava token exchange timed out after ${STRAVA_REQUEST_TIMEOUT_MS}ms`
            );
            return null;
        }
        console.warn("Strava token exchange failed", error);
        return null;
    }
};

const formatStravaLocalTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const offsetMs = date.getTimezoneOffset() * 60_000;

    return new Date(timestamp - offsetMs)
        .toISOString()
        .replace(/\.\d{3}Z$/, "Z");
};

const isTokenValid = (token: StravaToken | null): boolean => {
    if (!token?.accessToken) {
        return false;
    }

    if (!token.expiresAt) {
        return true;
    }

    return token.expiresAt * 1000 - Date.now() > 60_000;
};

const parseStravaActivityId = (value: unknown): string | null => {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return String(Math.trunc(value));
    }

    if (typeof value === "string") {
        return value.trim();
    }

    return null;
};

const getStravaConfig = (): StravaConfig => {
    const extra = Constants.expoConfig?.extra ?? {};
    const clientId = String(extra.stravaClientId ?? "");
    // TODO: Remove from git and client binary
    const clientSecret = String(extra.stravaClientSecret ?? "");
    const redirectScheme = String(
        extra.stravaRedirectScheme ?? "com.expench.yaga.development"
    );

    return { clientId, clientSecret, redirectScheme };
};

const waitForRedirect = async (
    openAuth: () => Promise<void>,
    redirectScheme: string
): Promise<string | null> => {
    return new Promise((resolve) => {
        let settled = false;
        let subscription: { remove: () => void } | null = null;
        const timeout = setTimeout(() => {
            if (!settled) {
                settled = true;
                subscription?.remove();
                resolve(null);
            }
        }, STRAVA_AUTH_REDIRECT_TIMEOUT_MS);

        const handler = ({ url }: { url: string }) => {
            if (!url || !url.startsWith(`${redirectScheme}://`)) {
                return;
            }

            if (!settled) {
                settled = true;
                clearTimeout(timeout);
                subscription?.remove();
                resolve(url);
            }
        };

        subscription = Linking.addEventListener("url", handler);

        openAuth().catch((error) => {
            if (!settled) {
                settled = true;
                clearTimeout(timeout);
                subscription?.remove();
                console.warn("Strava app auth failed to launch", error);
                resolve(null);
            }
        });
    });
};

const parseUrlParams = (url: string): Record<string, string> => {
    const [, queryString = ""] = url.split("?");
    const query =
        queryString.length > 0 ? queryString : url.split("#")[1] ?? "";
    const params = new URLSearchParams(query);
    const values: Record<string, string> = {};
    params.forEach((value, key) => {
        values[key] = value;
    });
    return values;
};

const safeJson = async (response: Response): Promise<unknown> => {
    try {
        return await response.json();
    } catch {
        return await response.text();
    }
};

const isAbortError = (error: unknown): boolean => {
    if (!(error instanceof Error)) {
        return false;
    }

    return error.name === "AbortError";
};
