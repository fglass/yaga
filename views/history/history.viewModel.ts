import React from "react";
import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { useCompletedWorkouts, useDatabaseWriter } from "../../model/database";
import { useAppleHealthWorkouts } from "../../model/health/health.hooks";
import { AppleHealthWorkout, CompletedWorkout } from "../../model/types";
import {
    getStravaLoggingEnabled,
    logStravaWorkout,
    openStravaActivity,
} from "../../model/strava";
import {
    dedupeWorkoutsByStart,
    parseWorkoutTimestamp,
    withWarning,
} from "../../utils/util";
import {
    getStravaActivityId,
    isLocalWorkoutSelectable,
    matchesWorkoutTemplateId,
} from "./history.viewModel.helpers";

export type HistoryItem =
    | { type: "local"; workout: CompletedWorkout; startDate: Date }
    | { type: "health"; workout: AppleHealthWorkout; startDate: Date };

interface Props {
    onSelectLocalWorkout: (workout: CompletedWorkout) => void;
    templateFilterId?: string | null;
}

interface ViewModel {
    combinedHistory: HistoryItem[];
    isAppleHealthLoading: boolean;
    onDeleteLocalWorkout: (workout: CompletedWorkout) => void;
    onSelectLocalWorkout: (workout: CompletedWorkout) => void;
    isLocalWorkoutSelectable: (workout: CompletedWorkout) => boolean;
    formatWorkoutDate: (date: Date | null | undefined) => string;
}

export const useHistoryViewModel = (props: Props): ViewModel => {
    const completedWorkouts = useCompletedWorkouts();
    const { workouts: appleHealthWorkouts, isLoading: isAppleHealthLoading } =
        useAppleHealthWorkouts();
    const { deleteCompletedWorkout, completeWorkout } = useDatabaseWriter();

    const combinedHistory = React.useMemo<HistoryItem[]>(() => {
        const normalizedTemplateFilterId = props.templateFilterId?.trim() ?? "";
        const items = [
            ...completedWorkouts.map<HistoryItem>((workout) => ({
                type: "local",
                startDate: parseWorkoutTimestamp(workout.startTimestamp),
                workout,
            })),
            ...appleHealthWorkouts.map<HistoryItem>((workout) => ({
                type: "health",
                startDate: workout.startDate,
                workout,
            })),
        ];

        const dedupedItems = dedupeWorkoutsByStart(items);
        const filteredItems =
            normalizedTemplateFilterId.length > 0
                ? dedupedItems.filter(
                      (item) =>
                          item.type === "local" &&
                          matchesWorkoutTemplateId(
                              item.workout,
                              normalizedTemplateFilterId
                          )
                  )
                : dedupedItems;

        const sortByDate = (item: HistoryItem): number => {
            if (item.type === "local") {
                return parseWorkoutTimestamp(
                    item.workout.startTimestamp
                ).getTime();
            }
            return item.workout.startDate.getTime();
        };

        return filteredItems.sort((a, b) => sortByDate(b) - sortByDate(a));
    }, [appleHealthWorkouts, completedWorkouts, props.templateFilterId]);

    const onDeleteLocalWorkout = React.useCallback(
        (workout: CompletedWorkout) => {
            withWarning(
                () => {
                    void deleteCompletedWorkout(workout.id);
                },
                { title: "Delete Workout", message: "Are you sure?" }
            );
        },
        [deleteCompletedWorkout]
    );

    const isSelectable = React.useCallback(
        (workout: CompletedWorkout) =>
            isLocalWorkoutSelectable(workout, {
                isStravaLoggingEnabled: getStravaLoggingEnabled(),
            }),
        []
    );

    const onSelectLocalWorkout = React.useCallback(
        (workout: CompletedWorkout) => {
            const stravaActivityId = getStravaActivityId(workout);
            if (workout.type === "run" && stravaActivityId != null) {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                void openStravaActivity(stravaActivityId).then((didOpen) => {
                    if (!didOpen) {
                        Alert.alert(
                            "Unable to open Strava",
                            "Could not open this activity."
                        );
                    }
                });
                return;
            }

            if (!isSelectable(workout)) {
                return;
            }

            if (workout.type === "run" && getStravaLoggingEnabled()) {
                Alert.alert("Upload to Strava", "Upload now?", [
                    {
                        text: "Cancel",
                        style: "cancel",
                    },
                    {
                        text: "Upload",
                        onPress: () => {
                            void (async () => {
                                if (!getStravaLoggingEnabled()) {
                                    Alert.alert("Strava logging disabled");
                                    return;
                                }

                                const nextStravaActivityId =
                                    await logStravaWorkout(workout);
                                if (!nextStravaActivityId) {
                                    void Haptics.notificationAsync(
                                        Haptics.NotificationFeedbackType.Error
                                    );
                                    Alert.alert("Upload Failed");
                                    return;
                                }

                                await completeWorkout({
                                    ...workout,
                                    metadata: {
                                        ...workout.metadata,
                                        stravaActivityId: nextStravaActivityId,
                                    },
                                });

                                void Haptics.notificationAsync(
                                    Haptics.NotificationFeedbackType.Success
                                );
                            })();
                        },
                    },
                ]);
                return;
            }
            props.onSelectLocalWorkout(workout);
        },
        [completeWorkout, isSelectable, props.onSelectLocalWorkout]
    );

    const formatWorkoutDate = React.useCallback(
        (date: Date | null | undefined): string => {
            if (!date || Number.isNaN(date.getTime())) {
                return "Unknown date";
            }

            const datePart = date.toLocaleDateString(undefined, {
                month: "short",
                day: "2-digit",
                year: "numeric",
            });
            const timePart = date.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
            });

            return `${datePart}, ${timePart}`;
        },
        []
    );

    return {
        combinedHistory,
        isAppleHealthLoading,
        onDeleteLocalWorkout,
        onSelectLocalWorkout,
        isLocalWorkoutSelectable: isSelectable,
        formatWorkoutDate,
    };
};
