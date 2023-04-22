import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "react-query";
import { ExerciseDef } from "./model";
import { generateGuid } from "./util";

// TODO: https://docs.expo.dev/versions/latest/sdk/sqlite/

enum Key {
    Version = "version",
    ExerciseDefs = "exerciseDefs",
}

export const initDatabase = async () => {
    const version = await select(Key.Version);
    if (version === null) {
        await insert(Key.Version, 1);
        await insert(Key.ExerciseDefs, exerciseDefs);
    }
};

/* Hooks */

export const useExerciseDefs = (): Record<string, ExerciseDef> => {
    const { isLoading, error, data } = useSelect(Key.ExerciseDefs);

    if (error) {
        console.error(error);
    }

    return isLoading ? {} : data;
};

// TODO: RQ mutation?
export const createExerciseDef = async (
    name: string,
    category: string
): Promise<string> => {
    const exerciseDefs = await select(Key.ExerciseDefs);

    const exerciseId = generateGuid();
    exerciseDefs[exerciseId] = { name, category };

    await insert(Key.ExerciseDefs, exerciseDefs);
    return exerciseId;
};

const useSelect = (key: string) => {
    return useQuery(key, async () => await select(key));
};

/* Database operations */

const getPrefixedKey = (key: string) => `$@yaga_${key}`;

const select = async (key: string) => {
    try {
        const jsonValue = await AsyncStorage.getItem(getPrefixedKey(key));
        return jsonValue != null ? JSON.parse(jsonValue) : undefined;
    } catch (e) {
        console.error(e);
    }
};

const insert = async (key: string, value: unknown) => {
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
