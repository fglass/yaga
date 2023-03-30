import React from "react";
import {
    PanGestureHandler,
    PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

const SWIPE_THRESHOLD_X = -100;

interface Props {
    children: React.ReactNode;
    onDelete: () => void;
}

export default (props: Props) => {
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(1);

    const onSwipe = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
        onActive: (event) => {
            translateX.value = Math.min(event.translationX, 0); // Only R2L
            opacity.value = translateX.value < SWIPE_THRESHOLD_X ? 0.5 : 1;
        },
        onEnd: () => {
            if (translateX.value < SWIPE_THRESHOLD_X) {
                runOnJS(props.onDelete)();
            } else {
                translateX.value = withSpring(0);
            }
        },
    });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
            opacity: opacity.value,
        };
    });

    return (
        <PanGestureHandler onGestureEvent={onSwipe}>
            <Animated.View style={animatedStyle}>
                {props.children}
            </Animated.View>
        </PanGestureHandler>
    );
};
