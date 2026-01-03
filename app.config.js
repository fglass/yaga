const appJson = require("./app.json");

module.exports = ({ config }) => {
    const baseConfig = appJson.expo ?? config;
    const baseBundleId =
        baseConfig?.ios?.bundleIdentifier ?? "com.expench.yaga";

    const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT;
    const bundleIdentifier = appVariant
        ? `${baseBundleId}.${appVariant}`
        : baseBundleId;

    const name = appVariant === "development" ? "Yaga Go" : baseConfig.name;
    const icon =
        appVariant === "development"
            ? "./assets/icon-inverse.png"
            : baseConfig.icon;

    const extra = {
        ...(baseConfig.extra ?? {}),
        appVariant,
    };

    return {
        ...baseConfig,
        name,
        icon,
        extra,
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
