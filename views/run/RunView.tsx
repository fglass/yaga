import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import Button from "../../components/Button";
import { Workout } from "../../model/types";
import { formatTime } from "../../utils/util";
import { useRunViewModel } from "./viewModel";

interface Props {
    initialRun: Workout;
    onFinish: () => Promise<void>;
    onCancel: () => Promise<void>;
}

const RunView = (props: Props) => {
    const vm = useRunViewModel(props);

    useKeepAwake();

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Text style={styles.title}>{vm.runName}</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.inlineStats}>
                    <View style={styles.inlineStat}>
                        <Text style={styles.inlineStatLabel}>Time</Text>
                        <Text style={styles.inlineStatValue}>
                            {formatTime(vm.durationSeconds)}
                        </Text>
                    </View>
                    <View style={styles.inlineStat}>
                        <Text style={styles.inlineStatLabel}>Pace</Text>
                        <Text style={styles.inlineStatValue}>
                            {vm.pacePerKm.replace("/km", "")}
                        </Text>
                    </View>
                </View>
                <View style={styles.distanceBlock}>
                    <Text style={styles.distanceValue}>
                        {vm.distanceKm.toFixed(2)}
                        {"\n"}
                        <Text style={styles.distanceUnit}>KM</Text>
                    </Text>
                </View>
            </View>

            <View style={styles.actions}>
                <View style={styles.inputRow}>
                    <View style={styles.speedRow}>
                        <TouchableOpacity
                            style={styles.adjustButton}
                            onPress={() => vm.onAdjustSpeed(-0.1)}
                            onLongPress={() => vm.onAdjustSpeed(-0.5)}
                            delayLongPress={200}
                        >
                            <Text style={styles.adjustLabel}>-</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.input}
                            value={vm.speedInput}
                            editable={false}
                            textAlign="center"
                        />
                        <TouchableOpacity
                            style={styles.adjustButton}
                            onPress={() => vm.onAdjustSpeed(0.1)}
                            onLongPress={() => vm.onAdjustSpeed(0.5)}
                            delayLongPress={200}
                        >
                            <Text style={styles.adjustLabel}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.startButton,
                        vm.hasStarted && styles.startButtonRunning,
                        !vm.canStart && styles.startButtonDisabled,
                    ]}
                    onPress={vm.onStartRun}
                    disabled={!vm.canStart}
                    activeOpacity={1}
                >
                    <Ionicons name="play" size={26} color="white" />
                </TouchableOpacity>

                <View style={styles.footerButtons}>
                    <Button
                        label="Finish"
                        colour="success"
                        onPress={vm.onFinishRun}
                        disabled={!vm.canFinish}
                        style={styles.footerButton}
                    />
                    <Button
                        label="Cancel"
                        colour="error"
                        onPress={vm.onCancelRun}
                        style={styles.footerButton}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: "#2A3135",
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "white",
    },
    inputRow: {
        marginBottom: 18,
        width: "100%",
    },
    input: {
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: "white",
        fontSize: 18,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        flex: 1,
    },
    speedRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        width: "100%",
    },
    adjustButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    adjustLabel: {
        color: "white",
        fontSize: 20,
        fontWeight: "700",
    },
    statsContainer: {
        flex: 1,
        justifyContent: "center",
        marginVertical: 12,
        gap: 18,
        alignItems: "center",
    },
    inlineStats: {
        flexDirection: "row",
        justifyContent: "center",
    },
    inlineStat: {
        flex: 1,
        alignItems: "center",
    },
    inlineStatLabel: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 12,
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    inlineStatValue: {
        color: "white",
        fontSize: 18,
        fontWeight: "600",
        letterSpacing: 0.3,
        fontVariant: ["tabular-nums"],
    },
    distanceBlock: {
        paddingVertical: 16,
        alignItems: "center",
    },
    distanceValue: {
        color: "white",
        fontSize: 82,
        fontWeight: "900",
        letterSpacing: 2,
        textAlign: "center",
        fontVariant: ["tabular-nums"],
    },
    distanceUnit: {
        fontSize: 64,
        color: "rgba(255, 255, 255, 0.9)",
        letterSpacing: 1.5,
        fontWeight: "800",
    },
    actions: {
        marginTop: "auto",
        paddingBottom: 28,
    },
    startButton: {
        backgroundColor: "#58A5F9",
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
        marginBottom: 14,
    },
    startButtonRunning: {
        backgroundColor: "#58A5F9",
    },
    startButtonDisabled: {
        opacity: 0.6,
    },
    footerButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    footerButton: {
        flex: 1,
        marginHorizontal: 0,
        marginBottom: 0,
    },
});

export default RunView;
