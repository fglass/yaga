module.exports = ({ config }) => {
    const baseConfig = {
        name: 'Yaga',
        slug: 'yaga',
        version: '1.0.0',
        orientation: 'portrait',
        platforms: ['ios'],
        icon: './assets/icon.png',
        userInterfaceStyle: 'dark',
        splash: {
            image: './assets/splash.png',
            resizeMode: 'contain',
            backgroundColor: '#2A3135',
        },
        assetBundlePatterns: ['**/*'],
        scheme: 'yaga',
        ios: {
            supportsTablet: true,
            bundleIdentifier: 'com.expench.yaga',
            infoPlist: {
                CFBundleDisplayName: 'Yaga',
                CFBundleName: 'Yaga',
                ITSAppUsesNonExemptEncryption: false,
                LSApplicationQueriesSchemes: ['strava'],
            },
        },
        extra: {
            eas: {
                projectId: '572100b8-fd56-4bbd-8d90-8e3b754b4d98',
            },
            stravaClientId: '192280',
            stravaClientSecret: 'REMOVED_STRAVA_CLIENT_SECRET',
            stravaRedirectScheme: 'yaga',
        },
        owner: 'expench',
        runtimeVersion: '1.0.0',
        updates: {
            url: 'https://u.expo.dev/572100b8-fd56-4bbd-8d90-8e3b754b4d98',
        },
        plugins: [
            [
                '@kingstinct/react-native-healthkit',
                {
                    NSHealthShareUsageDescription: 'Yaga needs read access.',
                    NSHealthUpdateUsageDescription: 'Yaga needs write access.',
                },
            ],
            'expo-font',
            'expo-notifications',
            'expo-sqlite',
            './plugins/withRecentWorkoutIntent',
        ],
        ...config,
    };
    const baseBundleId =
        baseConfig?.ios?.bundleIdentifier ?? 'com.expench.yaga';

    const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT;
    const isDevBuild = appVariant === "development";

    const bundleIdentifier = appVariant
        ? `${baseBundleId}.${appVariant}`
        : baseBundleId;

    const name = isDevBuild ? 'Yaga Go' : baseConfig.name;
    const icon = isDevBuild ? './assets/icon-inverse.png' : baseConfig.icon;

    const scheme = isDevBuild ? 'yaga-go' : baseConfig.scheme;

    const stravaRedirectScheme = isDevBuild
        ? 'yaga-go'
        : baseConfig.extra?.stravaRedirectScheme;

    const extra = {
        ...(baseConfig.extra ?? {}),
        appVariant,
        stravaRedirectScheme,
    };
    const infoPlist = {
        ...(baseConfig.ios?.infoPlist ?? {}),
        CFBundleDisplayName: name,
        CFBundleName: name,
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
            infoPlist,
        },
    };
};
