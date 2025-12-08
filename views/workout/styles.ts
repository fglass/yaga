import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 64,
    },
    card: {
        backgroundColor: "#353C42",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        padding: 14,
        marginBottom: 12,
    },
    headerCard: {
        marginBottom: 12,
        position: "relative",
    },
    headerText: {
        width: "100%",
        paddingRight: 0,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "white",
    },
    subtitle: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 14,
        fontWeight: "600",
    },
    headerSubtitle: {
        marginTop: 4,
    },
    notesInput: {
        marginTop: 10,
        borderRadius: 10,
        backgroundColor: "#2A3135",
        paddingHorizontal: 10,
        paddingVertical: 8,
        color: "white",
    },
    exerciseCard: {
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    cardHeaderRight: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 0,
        flexGrow: 0,
        marginTop: 4,
    },
    cardHeaderBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },
    cardHeaderBtnActive: {
        backgroundColor: "white",
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "white",
        maxWidth: 180,
    },
    cardTitleSmall: {
        fontSize: 16,
    },
    noteContainer: {
        marginTop: 4,
        borderRadius: 6,
        overflow: "hidden",
    },
    note: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        backgroundColor: "#2A3135",
        color: "white",
        borderRadius: 6,
        fontSize: 13,
        lineHeight: 18,
        textAlignVertical: "center",
    },
    thead: {
        flexDirection: "row",
        marginTop: 12,
        paddingBottom: 4,
    },
    th: {
        flex: 1,
        textAlign: "center",
        fontWeight: "600",
        color: "rgba(255, 255, 255, 0.6)",
    },
    trs: {
        marginTop: 6,
    },
    setSwipeContainer: {
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 6,
    },
    tr: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2A3135",
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    td: {
        flex: 1,
        textAlign: "center",
        color: "white",
        backgroundColor: "#202428",
        paddingVertical: 6,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    tdReadOnly: {
        backgroundColor: "#23282D",
        color: "rgba(255, 255, 255, 0.65)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
    },
    tdBtn: {
        width: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    narrow: {
        flex: 0.35,
    },
    finished: {
        backgroundColor: "rgba(101, 202, 121, 0.2)",
    },
    tdFinished: {
        backgroundColor: "rgba(101, 202, 121, 0.25)",
    },
    emptyCard: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 24,
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: "600",
        color: "white",
    },
    emptyText: {
        marginTop: 6,
        color: "rgba(255, 255, 255, 0.7)",
        textAlign: "center",
        lineHeight: 20,
    },
    footerCard: {
        marginBottom: 0,
    },
    footerButtons: {
        flexDirection: "row",
        alignItems: "stretch",
    },
    footerButton: {
        flex: 1,
        marginHorizontal: 0,
        marginBottom: 0,
    },
    footerButtonSpacing: {
        marginRight: 8,
    },
    loading: {
        flex: 1,
    },
    restTimerContainer: {
        position: "absolute",
        left: 10,
        right: 10,
        bottom: 16,
    },
    restTimerRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    restTimer: {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: 10,
        padding: 2,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        flex: 1,
    },
    restTimerFill: {
        backgroundColor: "rgba(77, 166, 255, 0.65)",
    },
    restTimerLabel: {
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
    restAdjustButton: {
        width: 44,
        height: 32,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 6,
    },
    restAdjustText: {
        color: "white",
        fontWeight: "700",
        letterSpacing: 0.2,
    },
});
