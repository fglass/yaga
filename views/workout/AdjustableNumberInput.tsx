import React, { useRef, useState } from "react";
import {
    StyleProp,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { styles } from "./workout.styles";

const DRAG_DISTANCE_PER_STEP_PX = 12;
const DRAG_START_THRESHOLD_PX = 8;

interface AdjustableNumberInputProps {
    value: string;
    step: number;
    onChangeText: (text: string) => void;
    onAdjust: (delta: number) => void;
    inputMode?: TextInputProps["inputMode"];
    onFocus?: () => void;
    onBlur?: () => void;
    isFinished?: boolean;
    inputStyle?: StyleProp<TextStyle>;
}

const AdjustableNumberInput = ({
    value,
    step,
    onAdjust,
    onChangeText,
    inputMode,
    onFocus,
    onBlur,
    isFinished,
    inputStyle,
}: AdjustableNumberInputProps) => {
    const inputRef = useRef<TextInput>(null);
    const [allowSoftInput, setAllowSoftInput] = useState(false);
    const allowSoftInputRef = useRef(false);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const isAdjustingRef = useRef(false);
    const [isFocused, setIsFocused] = useState(false);
    const lastStepRef = useRef(0);

    const setAllowSoftInputValue = (value: boolean) => {
        allowSoftInputRef.current = value;
        setAllowSoftInput(value);
    };

    const resetAdjustment = () => {
        lastStepRef.current = 0;
        setIsAdjusting(false);
        isAdjustingRef.current = false;
    };

    const tapGesture = Gesture.Tap()
        .maxDuration(250)
        .runOnJS(true)
        .onEnd((_, success) => {
            if (!success) {
                return;
            }
            setAllowSoftInputValue(true);
            requestAnimationFrame(() => {
                inputRef.current?.focus();
                onFocus?.();
            });
        });

    const panGesture = Gesture.Pan()
        .minDistance(4)
        .runOnJS(true)
        .onBegin(() => {
            lastStepRef.current = 0;
        })
        .onChange((event) => {
            if (!isAdjustingRef.current) {
                if (Math.abs(event.translationX) < DRAG_START_THRESHOLD_PX) {
                    return;
                }
                setAllowSoftInputValue(false);
                setIsAdjusting(true);
                isAdjustingRef.current = true;
                setIsFocused(false);
                inputRef.current?.blur();
                lastStepRef.current = Math.trunc(
                    event.translationX / DRAG_DISTANCE_PER_STEP_PX
                );
                return;
            }

            const steps = Math.trunc(
                event.translationX / DRAG_DISTANCE_PER_STEP_PX
            );
            if (steps !== lastStepRef.current) {
                const deltaSteps = steps - lastStepRef.current;
                lastStepRef.current = steps;
                onAdjust(deltaSteps * step);
            }
        })
        .onFinalize(() => {
            if (isAdjustingRef.current) {
                resetAdjustment();
            }
        });

    const gesture = Gesture.Race(panGesture, tapGesture);
    const displayValue = formatNumber(value);

    return (
        <GestureDetector gesture={gesture}>
            <View style={styles.adjustableInput}>
                <TextInput
                    ref={inputRef}
                    style={[
                        styles.td,
                        styles.adjustableInputField,
                        (isFocused || isAdjusting) &&
                            (isFinished
                                ? styles.tdFocusedFinished
                                : styles.tdFocused),
                        isFinished && styles.tdFinished,
                        inputStyle,
                    ]}
                    value={displayValue}
                    onChangeText={onChangeText}
                    inputMode={inputMode}
                    showSoftInputOnFocus={allowSoftInput}
                    onPressIn={() => {
                        if (!isAdjusting) {
                            setAllowSoftInputValue(true);
                        }
                    }}
                    onFocus={() => {
                        if (!allowSoftInputRef.current) {
                            inputRef.current?.blur();
                            return;
                        }
                        setIsFocused(true);
                        onFocus?.();
                    }}
                    onBlur={() => {
                        setAllowSoftInputValue(false);
                        setIsFocused(false);
                        if (!isAdjustingRef.current) {
                            resetAdjustment();
                        }
                        onBlur?.();
                    }}
                />
            </View>
        </GestureDetector>
    );
};

const formatNumber = (value: string): string => {
    const trimmed = value.trim();
    if (trimmed === "") {
        return "";
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
        return value;
    }

    if (Number.isInteger(parsed)) {
        return `${parsed}`;
    }

    return `${parsed}`;
};

export default AdjustableNumberInput;
