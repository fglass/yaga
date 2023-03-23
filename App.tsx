import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import WorkoutView from "./views/WorkoutView";

// open -a Simulator
export default function App() {
    return (
        <View style={styles.container}>
            <WorkoutView />
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2A3135",
    },
});
