const appJson = require("./app.json");

module.exports = ({ config }) => {
    const baseConfig = appJson.expo ?? config;
    const baseBundleId =
        baseConfig?.ios?.bundleIdentifier ?? "com.expench.yaga";

    const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT;
    const isDevBuild = appVariant === "development";

    const bundleIdentifier = appVariant
        ? `${baseBundleId}.${appVariant}`
        : baseBundleId;

    const name = isDevBuild ? "Yaga Go" : baseConfig.name;
    const icon = isDevBuild ? "./assets/icon-inverse.png" : baseConfig.icon;

    const scheme = isDevBuild ? "yaga-go" : baseConfig.scheme;

    const stravaRedirectScheme = isDevBuild
        ? "yaga-go"
        : baseConfig.extra?.stravaRedirectScheme;

    const extra = {
        ...(baseConfig.extra ?? {}),
        appVariant,
        stravaRedirectScheme,
    };

    return {
        ...baseConfig,
        name,
        icon,
        extra,
        scheme,
        ios: {
            ...baseConfig.ios,
            bundleIdentifier,
        },
        android: {
            ...baseConfig.android,
            package: bundleIdentifier,
        },
    };
};
