import React from "react";
import { useRouter } from "expo-router";
import RunView from "../views/run/RunView";
import { useActiveWorkout, useDatabaseWriter } from "../model/database";

const RunScreen = () => {
    const router = useRouter();
    const { activeWorkout } = useActiveWorkout();
    const { saveActiveWorkout } = useDatabaseWriter();

    if (!activeWorkout) return null;

    const onFinish = async () => {
        await saveActiveWorkout(null);
        router.replace("/(tabs)/history");
    };

    const onCancel = async () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/plan");
        }
        void saveActiveWorkout(null);
    };

    return (
        <RunView
            initialRun={activeWorkout}
            onFinish={onFinish}
            onCancel={onCancel}
        />
    );
};

export default RunScreen;
