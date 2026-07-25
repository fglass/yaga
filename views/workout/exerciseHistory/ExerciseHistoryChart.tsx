import React, { memo, useCallback, useMemo, useState } from "react";
import {
    GestureResponderEvent,
    LayoutChangeEvent,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import type { ExerciseHistoryChartPoint } from "./exerciseHistory.viewModel.core";

const CHART_HEIGHT = 138;
const PLOT_LEFT = 38;
const PLOT_RIGHT = 10;
const PLOT_TOP = 10;
const PLOT_BOTTOM = 112;
const LINE_COLOR = "#58A5F9";
const TOOLTIP_WIDTH = 108;

type Props = {
    points: ExerciseHistoryChartPoint[];
};

type PositionedPoint = ExerciseHistoryChartPoint & {
    x: number;
    y: number;
};

const ExerciseHistoryChart = ({ points }: Props) => {
    const [width, setWidth] = useState(0);
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
        null
    );
    const geometry = useMemo(
        () => buildChartGeometry(points, width),
        [points, width]
    );
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);
        setWidth((currentWidth) =>
            currentWidth === nextWidth ? currentWidth : nextWidth
        );
    }, []);
    const handleChartPress = useCallback(
        (event: GestureResponderEvent) => {
            const { locationX, locationY } = event.nativeEvent;
            const nearestPoint = geometry.points.reduce<
                PositionedPoint | undefined
            >((nearest, point) => {
                if (!nearest) {
                    return point;
                }

                const pointDistance =
                    (point.x - locationX) ** 2 +
                    (point.y - locationY) ** 2;
                const nearestDistance =
                    (nearest.x - locationX) ** 2 +
                    (nearest.y - locationY) ** 2;
                return pointDistance < nearestDistance ? point : nearest;
            }, undefined);

            if (nearestPoint) {
                setSelectedWorkoutId(nearestPoint.workoutId);
            }
        },
        [geometry.points]
    );
    const selectedPoint = geometry.points.find(
        (point) => point.workoutId === selectedWorkoutId
    );

    if (points.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>1RM</Text>
            <View style={styles.card}>
                <View style={styles.chart} onLayout={handleLayout}>
                {geometry.ticks.map((tick) => (
                    <React.Fragment key={tick.value}>
                        <Text style={[styles.yLabel, { top: tick.y - 7 }]}>
                            {formatAxisValue(tick.value)}
                        </Text>
                        <View style={[styles.gridline, { top: tick.y }]} />
                    </React.Fragment>
                ))}
                {geometry.xTicks.map((tick) => (
                    <Text
                        key={tick.timestamp}
                        style={[
                            styles.xLabel,
                            {
                                left: Math.max(
                                    0,
                                    Math.min(width - 52, tick.x - 26)
                                ),
                            },
                        ]}
                    >
                        {formatShortDate(tick.timestamp)}
                    </Text>
                ))}
                {geometry.points.slice(1).map((point, index) => {
                    const previousPoint = geometry.points[index];
                    const dx = point.x - previousPoint.x;
                    const dy = point.y - previousPoint.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

                    return (
                        <View
                            key={`${previousPoint.workoutId}-${point.workoutId}`}
                            style={[
                                styles.line,
                                {
                                    width: length,
                                    left: (previousPoint.x + point.x) / 2 - length / 2,
                                    top: (previousPoint.y + point.y) / 2 - 1,
                                    transform: [{ rotate: `${angle}deg` }],
                                },
                            ]}
                        />
                    );
                })}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select the nearest chart point"
                    style={styles.interactionLayer}
                    onPress={handleChartPress}
                />
                {geometry.points.map((point) => (
                    <View
                        key={point.workoutId}
                        accessible
                        pointerEvents="none"
                        accessibilityLabel={`${formatAccessibleDate(
                            point.finishedAt
                        )}, estimated one rep max ${formatChartValue(
                            point.estimatedOneRepMax
                        )}`}
                        style={[
                            styles.dot,
                            point.workoutId === selectedWorkoutId &&
                                styles.selectedDot,
                            {
                                left: point.x - 5,
                                top: point.y - 5,
                            },
                        ]}
                    />
                ))}
                {selectedPoint ? (
                    <View
                        pointerEvents="none"
                        style={[
                            styles.tooltip,
                            {
                                left: Math.max(
                                    0,
                                    Math.min(
                                        width - TOOLTIP_WIDTH,
                                        selectedPoint.x - TOOLTIP_WIDTH / 2
                                    )
                                ),
                                top:
                                    selectedPoint.y > 50
                                        ? selectedPoint.y - 44
                                        : selectedPoint.y + 14,
                            },
                        ]}
                    >
                        <Text style={styles.tooltipValue}>
                            {formatChartValue(
                                selectedPoint.estimatedOneRepMax
                            )}
                        </Text>
                        <Text style={styles.tooltipDate}>
                            {formatAccessibleDate(selectedPoint.finishedAt)}
                        </Text>
                    </View>
                ) : null}
                </View>
            </View>
        </View>
    );
};

const buildChartGeometry = (
    points: ExerciseHistoryChartPoint[],
    width: number
): {
    points: PositionedPoint[];
    ticks: { value: number; y: number }[];
    xTicks: { timestamp: number; x: number }[];
} => {
    if (width <= PLOT_LEFT + PLOT_RIGHT || points.length === 0) {
        return { points: [], ticks: [], xTicks: [] };
    }

    const values = points.map((point) => point.estimatedOneRepMax);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const range = dataMax - dataMin;
    const padding = range > 0 ? range * 0.15 : Math.max(dataMax * 0.1, 1);
    const paddedMin = Math.max(0, dataMin - padding);
    const paddedMax = dataMax + padding;
    const min = Math.floor(paddedMin * 2) / 2;
    const max = Math.ceil(paddedMax * 2) / 2;
    const plotWidth = width - PLOT_LEFT - PLOT_RIGHT;
    const plotHeight = PLOT_BOTTOM - PLOT_TOP;
    const valueToY = (value: number) =>
        PLOT_TOP + ((max - value) / (max - min)) * plotHeight;

    const firstTimestamp = Math.min(
        ...points.map((point) => point.finishedAt)
    );
    const lastTimestamp = Math.max(
        ...points.map((point) => point.finishedAt)
    );
    const timestampRange = lastTimestamp - firstTimestamp;

    const timestampToX = (timestamp: number) =>
        timestampRange === 0
            ? PLOT_LEFT + plotWidth / 2
            : PLOT_LEFT +
              ((timestamp - firstTimestamp) / timestampRange) * plotWidth;
    const xTickTimestamps =
        timestampRange === 0
            ? [firstTimestamp]
            : [
                  firstTimestamp,
                  firstTimestamp + timestampRange / 2,
                  lastTimestamp,
              ];

    const midpoint = Math.round(max + min) / 2;
    const tickValues = Array.from(new Set([max, midpoint, min]));

    return {
        points: points.map((point) => ({
            ...point,
            x: timestampToX(point.finishedAt),
            y: valueToY(point.estimatedOneRepMax),
        })),
        ticks: tickValues.map((value) => ({
            value,
            y: valueToY(value),
        })),
        xTicks: xTickTimestamps.map((timestamp) => ({
            timestamp,
            x: timestampToX(timestamp),
        })),
    };
};

const formatChartValue = (value: number) =>
    new Intl.NumberFormat("en-GB", {
        maximumFractionDigits: 1,
    }).format(value);

const formatAxisValue = (value: number) => formatChartValue(value);

const formatShortDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-GB", {
        month: "short",
    });

const formatAccessibleDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

const styles = StyleSheet.create({
    container: {
        marginBottom: 14,
    },
    card: {
        paddingTop: 4,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        backgroundColor: "rgba(255, 255, 255, 0.035)",
    },
    title: {
        marginLeft: 2,
        marginBottom: 6,
        color: "white",
        fontSize: 13,
        fontWeight: "600",
    },
    chart: {
        height: CHART_HEIGHT,
        position: "relative",
    },
    gridline: {
        position: "absolute",
        left: PLOT_LEFT,
        right: PLOT_RIGHT,
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
    yLabel: {
        position: "absolute",
        left: 0,
        width: PLOT_LEFT - 6,
        color: "rgba(255, 255, 255, 0.45)",
        fontSize: 9,
        textAlign: "right",
        fontVariant: ["tabular-nums"],
    },
    xLabel: {
        position: "absolute",
        top: PLOT_BOTTOM + 10,
        width: 52,
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: 9,
        textAlign: "center",
    },
    line: {
        position: "absolute",
        height: 2,
        borderRadius: 1,
        backgroundColor: LINE_COLOR,
    },
    interactionLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    dot: {
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: "#353C42",
        backgroundColor: LINE_COLOR,
    },
    selectedDot: {
        borderColor: "white",
    },
    tooltip: {
        position: "absolute",
        width: TOOLTIP_WIDTH,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        backgroundColor: "#4A535A",
        alignItems: "center",
    },
    tooltipValue: {
        color: "white",
        fontSize: 11,
        fontWeight: "600",
        fontVariant: ["tabular-nums"],
    },
    tooltipDate: {
        marginTop: 1,
        color: "rgba(255, 255, 255, 0.65)",
        fontSize: 9,
    },
});

export default memo(ExerciseHistoryChart);
