import React from "react";
import * as NativeTabsModule from "expo-router/unstable-native-tabs";
import { usePathname } from "expo-router";
import * as Haptics from "expo-haptics";

const NativeTabs = NativeTabsModule.NativeTabs;

const TAB_ROUTE_NAMES = new Set(["(home)", "plan", "history"]);

const TabLayout = () => {
    const pathname = usePathname();
    const previousTabNameRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        const routeSegment = pathname.replace(/^\/+/, "").split("/")[0] ?? "";
        const currentTabName = routeSegment === "" ? "(home)" : routeSegment;

        if (!TAB_ROUTE_NAMES.has(currentTabName)) {
            return;
        }

        const previousTabName = previousTabNameRef.current;
        previousTabNameRef.current = currentTabName;

        if (previousTabName == null || previousTabName === currentTabName) {
            return;
        }

        void Haptics.selectionAsync();
    }, [pathname]);

    return (
        <NativeTabs
            backgroundColor="#2A3135"
            tintColor="#58A5F9"
            iconColor="rgba(255, 255, 255, 0.65)"
        >
            <NativeTabs.Trigger name="(home)">
                <NativeTabs.Trigger.Icon
                    sf={{ default: "house", selected: "house.fill" }}
                />
                <NativeTabs.Trigger.Label hidden>Home</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="plan">
                <NativeTabs.Trigger.Icon
                    sf={{ default: "list.bullet", selected: "list.bullet" }}
                />
                <NativeTabs.Trigger.Label hidden>Plan</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="history">
                <NativeTabs.Trigger.Icon
                    sf={{ default: "clock", selected: "clock.fill" }}
                />
                <NativeTabs.Trigger.Label hidden>
                    History
                </NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
};

export default TabLayout;
