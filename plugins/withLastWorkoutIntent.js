const fs = require('fs');
const path = require('path');
const {
    createRunOncePlugin,
    withInfoPlist,
} = require('@expo/config-plugins');
const { withBuildSourceFile } = require('@expo/config-plugins/build/ios/XcodeProjectFile');

const SWIFT_SOURCE_PATH = path.join(
    __dirname,
    'ios',
    'LastWorkoutIntent.swift'
);
const SWIFT_DEST_PATH = 'LastWorkoutIntent.swift';

const withLastWorkoutIntent = (config) => {
    const swiftContents = fs.readFileSync(SWIFT_SOURCE_PATH, 'utf8');

    config = withBuildSourceFile(config, {
        filePath: SWIFT_DEST_PATH,
        contents: swiftContents,
        overwrite: true,
    });

    config = withInfoPlist(config, (config) => {
        const infoPlist = config.modResults ?? {};
        const envDbName = process.env.EXPO_PUBLIC_DB_NAME;
        const existingDbName = infoPlist.EXPO_PUBLIC_DB_NAME;
        const resolvedDbName = envDbName ?? existingDbName;

        if (resolvedDbName) {
            infoPlist.EXPO_PUBLIC_DB_NAME = resolvedDbName;
        }

        config.modResults = infoPlist;
        return config;
    });

    return config;
};

module.exports = createRunOncePlugin(
    withLastWorkoutIntent,
    'withLastWorkoutIntent',
    '1.0.0'
);
