import React from "react";
import { Stack } from "expo-router";

const HomeLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "simple_push",
            }}
        />
    );
};

export default HomeLayout;
