import React from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

type Props = {
    height: number;
    fadeStartPx: number;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    solidStopMin?: number;
    solidStopMax?: number;
    tintOverlayColor?: string;
};

const DEFAULT_INTENSITY = 6;
const DEFAULT_SOLID_STOP_MIN = 0.2;
const DEFAULT_SOLID_STOP_MAX = 0.9;
const DEFAULT_TINT_OVERLAY_COLOR = 'rgba(42, 49, 53, 0.05)';

const BlurFadeBackdrop = ({
    height,
    fadeStartPx,
    style,
    intensity = DEFAULT_INTENSITY,
    solidStopMin = DEFAULT_SOLID_STOP_MIN,
    solidStopMax = DEFAULT_SOLID_STOP_MAX,
    tintOverlayColor = DEFAULT_TINT_OVERLAY_COLOR,
}: Props) => {
    if (height <= 0) {
        return null;
    }

    const fadeStartRatio = fadeStartPx / height;
    const solidStop = Math.min(
        Math.max(fadeStartRatio, solidStopMin),
        solidStopMax
    );

    return (
        <MaskedView
            pointerEvents='none'
            style={style}
            maskElement={
                <LinearGradient
                    colors={[
                        'rgba(0, 0, 0, 1)',
                        'rgba(0, 0, 0, 1)',
                        'rgba(0, 0, 0, 0)',
                    ]}
                    locations={[0, solidStop, 1]}
                    style={styles.maskGradient}
                />
            }
        >
            <BlurView intensity={intensity} tint='dark' style={styles.blurFill} />
            <View
                style={[
                    styles.tintOverlay,
                    { backgroundColor: tintOverlayColor },
                ]}
            />
        </MaskedView>
    );
};

const styles = StyleSheet.create({
    maskGradient: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    blurFill: {
        flex: 1,
    },
    tintOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default BlurFadeBackdrop;
