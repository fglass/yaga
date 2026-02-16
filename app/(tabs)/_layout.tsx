import React from "react";
import * as NativeTabsModule from "expo-router/unstable-native-tabs";
import { usePathname } from "expo-router";
import * as Haptics from "expo-haptics";

const NativeTabs = NativeTabsModule.NativeTabs;
const NativeTabTrigger = NativeTabsModule.NativeTabTrigger;

const TAB_ROUTE_NAMES = new Set(["index", "plan", "history"]);

const TabLayout = () => {
    const pathname = usePathname();
    const previousTabNameRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        const routeSegment = pathname.replace(/^\/+/, "").split("/")[0] ?? "";
        const currentTabName = routeSegment === "" ? "index" : routeSegment;

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
            <NativeTabTrigger
                name="index"
                options={{
                    title: "",
                    icon: { sf: "house" },
                    selectedIcon: { sf: "house.fill" },
                }}
            />
            <NativeTabTrigger
                name="plan"
                options={{
                    title: "",
                    icon: { sf: "list.bullet" },
                    selectedIcon: { sf: "list.bullet" },
                }}
            />
            <NativeTabTrigger
                name="history"
                options={{
                    title: "",
                    icon: { sf: "clock" },
                    selectedIcon: { sf: "clock.fill" },
                }}
            />
        </NativeTabs>
    );
};

export default TabLayout;
