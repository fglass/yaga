import React from "react";
import {
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    View,
} from "react-native";
import { Workout } from "../../model/types";

interface Props {
    workouts: Workout[];
    onSelect: (workout: Workout) => void;
}

export default (props: Props) => {
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
});
