const appJson = require("./app.json");

module.exports = ({ config }) => {
    const baseConfig = appJson.expo ?? config;
    const baseBundleId =
        baseConfig?.ios?.bundleIdentifier ?? "com.expench.yaga";

    const appVariant = process.env.APP_VARIANT;
    const bundleIdentifier = appVariant
        ? `${baseBundleId}.${appVariant}`
        : baseBundleId;

    return {
        ...baseConfig,
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
