const { execSync } = require("child_process");

const getGitCommit = () => {
    const envCommit = process.env.EAS_BUILD_GIT_COMMIT_HASH;

    if (envCommit) {
        return envCommit.slice(0, 7);
    }

    try {
        return execSync("git rev-parse --short HEAD", {
            stdio: ["ignore", "pipe", "ignore"],
        })
            .toString()
            .trim();
    } catch {
        return "unknown";
    }
};

const gitCommit = getGitCommit();

module.exports = ({ config }) => {
    const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT;
    const appName = appVariant === "development" ? "Yaga Go" : "Yaga";

    const baseDefaults = {
        name: appName,
        slug: "yaga",
        version: "1.0.0",
        orientation: "portrait",
        platforms: ["ios"],
        icon: "./assets/icon.png",
        userInterfaceStyle: "dark",
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#2A3135",
        },
        assetBundlePatterns: ["**/*"],
        scheme: "yaga",
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.expench.yaga",
            infoPlist: {
                CFBundleDisplayName: "Yaga",
                CFBundleName: "Yaga",
                ITSAppUsesNonExemptEncryption: false,
                LSApplicationQueriesSchemes: ["strava"],
            },
        },
        extra: {
            eas: {
                projectId: "572100b8-fd56-4bbd-8d90-8e3b754b4d98",
            },
            stravaClientId: "192280",
            stravaClientSecret: "REMOVED_STRAVA_CLIENT_SECRET",
            stravaRedirectScheme: "yaga",
        },
        owner: "expench",
        runtimeVersion: "1.0.0",
        updates: {
            url: "https://u.expo.dev/572100b8-fd56-4bbd-8d90-8e3b754b4d98",
        },
        plugins: [
            [
                "@kingstinct/react-native-healthkit",
                {
                    NSHealthShareUsageDescription: "Yaga needs read access.",
                    NSHealthUpdateUsageDescription: "Yaga needs write access.",
                },
            ],
            "expo-asset",
            "expo-font",
            "expo-notifications",
            "expo-sqlite",
            "expo-router",
            "expo-secure-store",
            "./plugins/withLastWorkoutIntent",
        ],
    };

    const configWithoutName = { ...(config ?? {}) };
    delete configWithoutName.name;
    const baseConfig = {
        ...baseDefaults,
        ...configWithoutName,
    };
    const baseBundleId =
        baseConfig?.ios?.bundleIdentifier ?? "com.expench.yaga";

    const isDevBuild = appVariant === "development";

    const bundleIdentifier = appVariant
        ? `${baseBundleId}.${appVariant}`
        : baseBundleId;

    const icon = isDevBuild ? "./assets/icon-inverse.png" : baseConfig.icon;

    const scheme = isDevBuild ? "yaga-go" : baseConfig.scheme;

    const stravaRedirectScheme = isDevBuild
        ? "yaga-go"
        : baseConfig.extra?.stravaRedirectScheme;

    const extra = {
        ...(baseConfig.extra ?? {}),
        appVariant,
        stravaRedirectScheme,
        gitCommit,
    };
    const infoPlist = {
        ...(baseConfig.ios?.infoPlist ?? {}),
        CFBundleDisplayName: appName,
        CFBundleName: appName,
    };

    return {
        ...baseConfig,
        name: appName,
        icon,
        extra,
        scheme,
        ios: {
            ...baseConfig.ios,
            bundleIdentifier,
            infoPlist,
        },
    };
};
