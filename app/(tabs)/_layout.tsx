import React from 'react';
import * as NativeTabsModule from 'expo-router/unstable-native-tabs';

const NativeTabs = NativeTabsModule.NativeTabs;
const NativeTabTrigger = NativeTabsModule.NativeTabTrigger;

const TabLayout = () => {
    return (
        <NativeTabs
            backgroundColor='#2A3135'
            tintColor='#58A5F9'
            iconColor='rgba(255, 255, 255, 0.65)'
        >
            <NativeTabTrigger
                name='index'
                options={{
                    title: '',
                    icon: { sf: 'house' },
                    selectedIcon: { sf: 'house.fill' },
                }}
            />
            <NativeTabTrigger
                name='plan'
                options={{
                    title: '',
                    icon: { sf: 'list.bullet' },
                    selectedIcon: { sf: 'list.bullet' },
                }}
            />
            <NativeTabTrigger
                name='history'
                options={{
                    title: '',
                    icon: { sf: 'clock' },
                    selectedIcon: { sf: 'clock.fill' },
                }}
            />
        </NativeTabs>
    );
};

export default TabLayout;
