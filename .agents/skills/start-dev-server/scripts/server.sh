#!/bin/sh

set -eu

find_project_root() {
    current_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)

    while [ "$current_dir" != "/" ]; do
        if [ -f "$current_dir/package.json" ] && [ -d "$current_dir/.agents" ]; then
            printf '%s\n' "$current_dir"
            return 0
        fi
        current_dir=$(dirname -- "$current_dir")
    done

    printf 'Could not find the Yaga project root\n' >&2
    return 1
}

project_root=$(find_project_root)
project_key=$(printf '%s' "$project_root" | cksum | awk '{ print $1 }')
runtime_dir="${TMPDIR:-/tmp}/yaga-dev-server-$project_key"
pid_file="$runtime_dir/server.pid"
watchdog_pid_file="$runtime_dir/watchdog.pid"
log_file="$runtime_dir/server.log"
timeout_seconds=${YAGA_DEV_SERVER_TIMEOUT_SECONDS:-3600}

is_running() {
    [ -f "$pid_file" ] || return 1
    server_pid=$(cat "$pid_file")
    [ -n "$server_pid" ] || return 1
    kill -0 "$server_pid" 2>/dev/null
}

collect_descendants() {
    parent_pid=$1
    children=$(pgrep -P "$parent_pid" 2>/dev/null || true)

    for child_pid in $children; do
        collect_descendants "$child_pid"
        printf '%s\n' "$child_pid"
    done
}

stop_server() {
    cancel_watchdog=$1

    if [ "$cancel_watchdog" = "yes" ] && [ -f "$watchdog_pid_file" ]; then
        watchdog_pid=$(cat "$watchdog_pid_file")
        watchdog_descendants=$(collect_descendants "$watchdog_pid")
        watchdog_pids="$watchdog_descendants $watchdog_pid"
        # Intentional word splitting: each collected PID is a separate argument
        kill -TERM $watchdog_pids 2>/dev/null || true
    fi

    if is_running; then
        server_pid=$(cat "$pid_file")
        descendant_pids=$(collect_descendants "$server_pid")
        process_pids="$descendant_pids $server_pid"

        # Intentional word splitting: each collected PID is a separate argument
        kill -TERM $process_pids 2>/dev/null || true
        sleep 2
        for process_pid in $process_pids; do
            if kill -0 "$process_pid" 2>/dev/null; then
                kill -KILL "$process_pid" 2>/dev/null || true
            fi
        done
    fi

    rm -f "$pid_file" "$watchdog_pid_file"
}

start_server() {
    case "$timeout_seconds" in
        ''|*[!0-9]*|0)
            printf 'YAGA_DEV_SERVER_TIMEOUT_SECONDS must be a positive integer\n' >&2
            exit 2
            ;;
    esac

    mkdir -p "$runtime_dir"

    if is_running; then
        printf 'Yaga dev server is already running (PID %s)\n' "$(cat "$pid_file")"
        show_status
        show_logs
        return
    fi

    rm -f "$pid_file" "$watchdog_pid_file"
    : > "$log_file"

    (
        cd "$project_root"
        nohup npm run tunnel >> "$log_file" 2>&1 &
        printf '%s\n' "$!" > "$pid_file"
    )

    server_pid=$(cat "$pid_file")
    nohup sh -c 'sleep "$1"; exec "$2" expire "$3"' guardrail "$timeout_seconds" "$0" "$server_pid" >/dev/null 2>&1 &
    printf '%s\n' "$!" > "$watchdog_pid_file"

    printf 'Started Yaga dev server (PID %s)\n' "$server_pid"
    printf 'Automatic stop guardrail: %s seconds\n' "$timeout_seconds"
    printf 'Log: %s\n' "$log_file"
    sleep 3
    show_logs
}

show_status() {
    if is_running; then
        printf 'Yaga dev server is running (PID %s)\n' "$(cat "$pid_file")"
        printf 'Log: %s\n' "$log_file"
    else
        printf 'Yaga dev server is stopped\n'
        return 1
    fi
}

show_logs() {
    if [ ! -f "$log_file" ]; then
        printf 'No server log exists yet\n'
        return 1
    fi

    tail -n 60 "$log_file"
}

expire_server() {
    expected_pid=${1:-}

    if [ -f "$pid_file" ] && [ "$(cat "$pid_file")" = "$expected_pid" ]; then
        printf 'One-hour guardrail reached; stopping Yaga dev server\n' >> "$log_file"
        stop_server no
    fi
}

command_name=${1:-}

case "$command_name" in
    start)
        start_server
        ;;
    stop)
        if is_running; then
            stop_server yes
            printf 'Stopped Yaga dev server\n'
        else
            stop_server yes
            printf 'Yaga dev server is already stopped\n'
        fi
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    expire)
        expire_server "${2:-}"
        ;;
    *)
        printf 'Usage: %s {start|stop|status|logs}\n' "$0" >&2
        exit 2
        ;;
esac
