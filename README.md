# Yaga

Yet Another Gym App. Except no ads, accounts, or subscriptions — just your workouts.

For local development, copy `.env.example` to `.env.local` and set
`STRAVA_CLIENT_SECRET` to your Strava application secret. `.env.local` is ignored
by Git. Expo loads it automatically and includes the value in the app config.

For EAS cloud builds and updates, configure `STRAVA_CLIENT_SECRET` in the
corresponding EAS environment; the ignored local file is not committed.
