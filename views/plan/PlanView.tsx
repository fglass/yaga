import React from "react";
import {
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    View,
    ActionSheetIOS,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Workout } from "../../model/types";
import { exportDatabase, resetDatabase } from "../../model/database";

interface Props {
    workouts: Workout[];
    onSelect: (workout: Workout) => void;
}

export default (props: Props) => {
    const onAdminSettings = () =>
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ["Cancel", "Export", "Reset"],
                cancelButtonIndex: 0,
                destructiveButtonIndex: 2,
            },
            (btnIdx) => {
                if (btnIdx === 1) {
                    exportDatabase();
                } else if (btnIdx === 2) {
                    resetDatabase();
                }
            }
        );

    return (
        <View>
            <Text style={styles.title}>Plan</Text>
            <FlatList
                data={props.workouts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.workoutItem}
                        onPress={() => {
                            props.onSelect(item);
                        }}
                    >
                        <Text style={styles.workoutText}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
            <TouchableOpacity
                style={styles.adminButton}
                onPress={onAdminSettings}
            >
                <Ionicons name="ios-settings-sharp" color="white" size={20} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        marginLeft: 10,
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
    },
    workoutItem: {
        padding: 10,
        borderBottomColor: "white",
        borderBottomWidth: 1,
    },
    workoutText: {
        color: "white",
    },
    adminButton: {
        position: "absolute",
        top: 5,
        right: 10,
    },
});
