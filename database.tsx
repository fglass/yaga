import AsyncStorage from "@react-native-async-storage/async-storage";

// https://mateoguzmana.medium.com/persistent-state-management-using-async-storage-react-query-for-simple-react-native-apps-9206db073f4a

// @storage_Key
const insert = async (key: string, value: unknown) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        // saving error
    }
};

const select = async (key: string) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        // reading error
    }
};
