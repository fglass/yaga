---
name: start-dev-server
description: Start and manage Yaga's Expo development server in tunnel mode for remote access. Use when Codex needs to launch Metro for a remote development session, provide the tunnel link, check the tunnel, view its logs, or stop the background server safely.
---

# Start the Dev Server

Run all commands from the repository root. Use the bundled lifecycle script instead of launching Expo directly:

```sh
.agents/skills/start-dev-server/scripts/server.sh start
```

The script runs `npm run tunnel` in the background, records its PID and log outside the repository, and starts a one-hour stop guardrail. Repeated `start` calls reuse a running server rather than creating another one.

## Workflow

1. Start the server with `server.sh start`.
2. Read the displayed log excerpt. If Expo has not printed the dev-build URL yet, use `server.sh logs` after a short wait.
3. Give the user the clickable custom-scheme or tunnel URL printed by Expo for remote access. Do not substitute a localhost URL.
4. Keep the server running while it is needed for the active task.
5. Run `server.sh stop` as soon as work using the server is complete, including after errors or interrupted verification.

If the user's entire request is to start the server for their own continued use, leave it running, state that it will stop automatically after one hour, and provide the stop command. Do not stop it immediately after reporting the URL because that would defeat the requested session.

## Lifecycle commands

```sh
# Show whether the server is active and where its log lives
.agents/skills/start-dev-server/scripts/server.sh status

# Show recent Expo output and URLs
.agents/skills/start-dev-server/scripts/server.sh logs

# Stop Expo and cancel the guardrail
.agents/skills/start-dev-server/scripts/server.sh stop
```

Set `YAGA_DEV_SERVER_TIMEOUT_SECONDS` only when the user explicitly requests a different maximum lifetime. The default and expected value is `3600` seconds.

If startup fails, inspect `server.sh logs`, fix only issues within the task's scope, and stop the lifecycle before handing back. Never edit generated `ios/` files merely to start Metro.
