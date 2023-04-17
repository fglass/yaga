import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "react-query";
import { StatusBar } from "expo-status-bar";
import { initDatabase } from "./database";
import WorkoutView from "./views/workout/WorkoutView";

const queryClient = new QueryClient();

export default function App() {
    useEffect(() => {
        initDatabase();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={styles.container}>
                <WorkoutView />
                <StatusBar style="auto" />
            </GestureHandlerRootView>
        </QueryClientProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2A3135",
    },
});
