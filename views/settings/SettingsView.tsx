import React from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ImportView from "../import/ImportView";
import { useSettingsViewModel } from "./settings.viewModel";

type SettingRowProps = {
    title: string;
    onPress?: () => void;
    toggleValue?: boolean;
    onToggleValueChange?: () => void;
    isDestructive?: boolean;
};

const SettingsRow = ({
    title,
    onPress,
    toggleValue,
    onToggleValueChange,
    isDestructive = false,
}: SettingRowProps) => {
    const isToggle = typeof toggleValue === "boolean";
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            style={styles.row}
            {...(onPress
                ? {
                      activeOpacity: 0.75,
                      onPress,
                  }
                : {})}
        >
            <View style={styles.rowCopy}>
                <Text
                    style={[
                        styles.rowTitle,
                        isDestructive && styles.dangerText,
                    ]}
                >
                    {title}
                </Text>
            </View>
            <View style={styles.rowMeta}>
                {isToggle ? (
                    <Switch
                        value={toggleValue}
                        onValueChange={onToggleValueChange}
                        trackColor={{
                            false: "rgba(255, 255, 255, 0.18)",
                            true: "rgba(123, 216, 155, 0.32)",
                        }}
                        thumbColor={toggleValue ? "#9BE28A" : "#F2F2F2"}
                        ios_backgroundColor="rgba(255, 255, 255, 0.18)"
                    />
                ) : (
                    <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="rgba(255, 255, 255, 0.22)"
                    />
                )}
            </View>
        </Container>
    );
};

const SettingsView = () => {
    const vm = useSettingsViewModel();

    return (
        <View style={styles.screen}>
            <ScrollView
                contentInsetAdjustmentBehavior="never"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.content,
                    {
                        paddingBottom: 120,
                    },
                ]}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Settings</Text>
                        <Text
                            style={styles.versionTag}
                        >{`Version: ${vm.gitCommit}`}</Text>
                    </View>
                </View>

                <View style={styles.list}>
                    <SettingsRow
                        title="Health Logging"
                        toggleValue={vm.isHealthLoggingEnabled}
                        onToggleValueChange={vm.toggleHealthLogging}
                    />
                    <View style={styles.divider} />
                    <SettingsRow
                        title="Strava Logging"
                        toggleValue={vm.isStravaLoggingEnabled}
                        onToggleValueChange={vm.toggleStravaLogging}
                    />
                    <SettingsRow
                        title="Connect to Strava"
                        onPress={() => void vm.authStrava()}
                    />
                    <View style={styles.divider} />
                    <View style={styles.divider} />
                    <SettingsRow
                        title="Export Database"
                        onPress={() => void vm.exportDatabase()}
                    />
                    <View style={styles.divider} />
                    <SettingsRow
                        title="Import Strong App"
                        onPress={() => void vm.openImportFromStrong()}
                    />
                    <View style={styles.divider} />
                    <SettingsRow
                        title="Import Database"
                        onPress={() => void vm.importDatabase()}
                    />
                    <View style={styles.divider} />
                    <SettingsRow
                        title="Reset Database"
                        onPress={() => void vm.resetDatabase()}
                        isDestructive
                    />
                </View>
            </ScrollView>
            {vm.isImportVisible ? (
                <ImportView
                    isVisible={vm.isImportVisible}
                    onClose={vm.closeImportFromStrong}
                    fileUri={vm.importFileUri}
                    fileName={vm.importFileName}
                />
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#2A3135",
    },
    content: {
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
    },
    title: {
        color: "white",
        fontSize: 28,
        fontWeight: "700",
    },
    versionTag: {
        marginTop: 4,
        color: "rgba(255, 255, 255, 0.7)",
        marginBottom: 6,
    },
    list: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "rgba(255, 255, 255, 0.12)",
        marginBottom: 30,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
    },
    rowCopy: {
        flex: 1,
        paddingRight: 12,
    },
    rowTitle: {
        color: "white",
        fontSize: 17,
        fontWeight: "500",
    },
    dangerText: {
        color: "#FF8D8D",
    },
    rowMeta: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 0,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
    },
});

export default SettingsView;
