jest.mock("expo-asset", () => ({
    Asset: {
        fromModule: () => ({
            downloadAsync: async () => undefined,
        }),
    },
}));
