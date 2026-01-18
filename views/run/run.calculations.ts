export const computeRunDistance = ({
    hasStarted,
    initialDistanceKm,
    speedKmh,
    elapsedSeconds,
    distanceOffsetKm,
    distanceAnchorElapsedSeconds,
}: {
    hasStarted: boolean;
    initialDistanceKm: number;
    speedKmh: number;
    elapsedSeconds: number;
    distanceOffsetKm: number;
    distanceAnchorElapsedSeconds: number;
}): number => {
    if (!hasStarted) {
        return initialDistanceKm;
    }

    if (speedKmh == null || speedKmh <= 0) {
        return distanceOffsetKm;
    }

    const elapsedSinceAnchor = Math.max(
        0,
        elapsedSeconds - distanceAnchorElapsedSeconds
    );
    return distanceOffsetKm + (speedKmh * elapsedSinceAnchor) / 3600;
};
