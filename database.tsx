import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "react-query";
import { ExerciseDef } from "./model";

export const initDatabase = async () => {
    const version = await AsyncStorage.getItem(getPrefixedKey("version"));
    if (version === null) {
        await insert("version", 1);
        await insert("exerciseDefs", exerciseDefs);
    }
};

export const getExerciseDefs = (): Record<string, ExerciseDef> => {
    const { isLoading, error, data } = select("exerciseDefs");

    if (error) {
        console.error(error);
    }

    return isLoading ? {} : data;
};

/* Database operations */

const getPrefixedKey = (key: string) => `$@yaga_${key}`;

const select = (key: string) => {
    return useQuery(key, async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(getPrefixedKey(key));
            return jsonValue != null ? JSON.parse(jsonValue) : undefined;
        } catch (e) {
            console.error(e);
        }
    });
};

const insert = async (key: string, value: unknown) => {
    // TODO: use react-query?
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(getPrefixedKey(key), jsonValue);
    } catch (e) {
        console.error(e);
    }
};

/* Initial records */

const exerciseDefs: Record<string, ExerciseDef> = {
    "6a001abb-1a20-4ccc-bf81-d5825923f8c8": {
        name: "Squat",
        category: "Legs",
    },
    "34da1abc-cfbc-4dda-b2b5-58c16de24d3a": {
        name: "Lying Leg Curl",
        category: "Legs",
    },
    "fb87dc04-da1c-4481-a3df-1776662c4a01": {
        name: "Seated Calf Raise",
        category: "Legs",
    },
};
