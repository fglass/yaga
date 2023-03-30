import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import WorkoutView from "./views/WorkoutView";

export default function App() {
    return (
        <GestureHandlerRootView style={styles.container}>
            <WorkoutView />
            <StatusBar style="auto" />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2A3135",
    },
});
