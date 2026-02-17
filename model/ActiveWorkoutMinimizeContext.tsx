import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ActiveWorkoutMinimizeContextValue = {
    isMinimized: boolean;
    setIsMinimized: (next: boolean) => void;
    minimize: () => void;
    restore: () => void;
};

const ActiveWorkoutMinimizeContext = createContext<ActiveWorkoutMinimizeContextValue | null>(
    null
);

export const ActiveWorkoutMinimizeProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [isMinimized, setIsMinimized] = useState(false);

    const minimize = useCallback(() => {
        setIsMinimized(true);
    }, []);

    const restore = useCallback(() => {
        setIsMinimized(false);
    }, []);

    const value = useMemo(
        () => ({
            isMinimized,
            setIsMinimized,
            minimize,
            restore,
        }),
        [isMinimized, minimize, restore]
    );

    return (
        <ActiveWorkoutMinimizeContext.Provider value={value}>
            {children}
        </ActiveWorkoutMinimizeContext.Provider>
    );
};

export const useActiveWorkoutMinimize = (): ActiveWorkoutMinimizeContextValue => {
    const context = useContext(ActiveWorkoutMinimizeContext);
    if (!context) {
        throw new Error('useActiveWorkoutMinimize must be used within ActiveWorkoutMinimizeProvider');
    }
    return context;
};
