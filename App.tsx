import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RootView from "./views/RootView";

const queryClient = new QueryClient();

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <RootView />
        </QueryClientProvider>
    );
}
