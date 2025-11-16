import React, { ComponentProps } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type NavigationTab = "home" | "plan" | "history";

interface Props {
    activeTab: NavigationTab;
    onSelectTab: (tab: NavigationTab) => void;
    style?: ViewStyle;
}

type IconName = ComponentProps<typeof Ionicons>["name"];

interface FooterTab {
    key: NavigationTab;
    label: string;
    icon: IconName;
    activeIcon: IconName;
}

const FOOTER_TABS: FooterTab[] = [
    {
        key: "home",
        label: "Home",
        icon: "home-outline",
        activeIcon: "home",
    },
    {
        key: "plan",
        label: "Plan",
        icon: "list-outline",
        activeIcon: "list",
    },
    {
        key: "history",
        label: "History",
        icon: "time-outline",
        activeIcon: "time",
    },
];

const NavigationFooter = ({ activeTab, onSelectTab, style }: Props) => {
    return (
        <View style={[styles.container, style]}>
            {FOOTER_TABS.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={styles.tab}
                        onPress={() => onSelectTab(tab.key)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                    >
                        <Ionicons
                            name={isActive ? tab.activeIcon : tab.icon}
                            size={20}
                            color={
                                isActive
                                    ? "#58A5F9"
                                    : "rgba(255, 255, 255, 0.65)"
                            }
                        />
                        <Text
                            style={[
                                styles.tabLabel,
                                isActive && styles.tabLabelActive,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: 24,
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.08)",
        backgroundColor: "#2A3135",
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    tabLabel: {
        marginTop: 6,
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.65)",
    },
    tabLabelActive: {
        color: "white",
        fontWeight: "600",
    },
});

export default NavigationFooter;
