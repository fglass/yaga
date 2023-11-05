import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 10,
        borderBottomColor: "#58A5F9",
        borderBottomWidth: 1,
    },
    footer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
    },
    subtitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "white",
        opacity: 0.5,
    },
    card: {
        flex: 1,
        padding: 10,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cardHeaderRight: {
        flexDirection: "row",
    },
    cardHeaderBtn: {
        marginLeft: 7,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        color: "#58A5F9",
    },
    noteContainer: {
        marginTop: 5,
        padding: 0,
        borderRadius: 5,
        overflow: "hidden",
    },
    note: {
        paddingLeft: 5,
        paddingVertical: 5,
        backgroundColor: "#5C5736",
        color: "#CEAF46",
    },
    thead: {
        flexDirection: "row",
        paddingVertical: 10,
    },
    th: {
        flex: 1,
        textAlign: "center",
        fontWeight: "bold",
        color: "white",
    },
    trs: {
        overflow: "hidden",
        borderRadius: 5,
    },
    tr: {
        backgroundColor: "#2A3135",
        flexDirection: "row",
        paddingVertical: 10,
    },
    td: {
        flex: 1,
        textAlign: "center",
        color: "white",
        backgroundColor: "#202428",
        padding: 2,
        marginRight: 10,
        borderRadius: 5,
    },
    tdBtn: {
        width: 30,
        padding: 0,
        marginHorizontal: 0,
        marginBottom: 0,
    },
    narrow: {
        marginLeft: 5,
        maxWidth: 33,
    },
    finished: {
        backgroundColor: "#445E4C",
    },
    tdFinished: {
        backgroundColor: "#597E5D",
    },
    loading: {
        height: "100%",
    },
});
