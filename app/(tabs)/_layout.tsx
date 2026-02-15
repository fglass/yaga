import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const TabLayout = () => {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                lazy: false,
                sceneStyle: {
                    backgroundColor: "#2A3135",
                },
                tabBarStyle: {
                    backgroundColor: "#2A3135",
                    borderTopColor: "rgba(255, 255, 255, 0.08)",
                    borderTopWidth: 1,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: "#58A5F9",
                tabBarInactiveTintColor: "rgba(255, 255, 255, 0.65)",
                tabBarLabelStyle: {
                    marginTop: 6,
                    fontSize: 12,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="plan"
                options={{
                    title: "Plan",
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "list" : "list-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: "History",
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "time" : "time-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
};

export default TabLayout;
