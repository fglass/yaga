import { computeRunDistance } from "../calculations";

describe("computeRunDistance", () => {
    it("calculates distance from a constant pace over a fixed duration", () => {
        const distanceKm = computeRunDistance({
            hasStarted: true,
            initialDistanceKm: 0,
            speedKmh: 12,
            elapsedSeconds: 1800,
            distanceOffsetKm: 0,
            distanceAnchorElapsedSeconds: 0,
        });

        expect(distanceKm).toBeCloseTo(6, 4);
    });

    it("accumulates distance correctly across a pace change", () => {
        const secondsInHour = 3600;

        const firstLegDistance = computeRunDistance({
            hasStarted: true,
            initialDistanceKm: 0,
            speedKmh: 10,
            elapsedSeconds: secondsInHour,
            distanceOffsetKm: 0,
            distanceAnchorElapsedSeconds: 0,
        });

        const secondLegSpeedKmh = 12;
        const totalDistance = computeRunDistance({
            hasStarted: true,
            initialDistanceKm: 0,
            speedKmh: secondLegSpeedKmh,
            elapsedSeconds: secondsInHour * 2,
            distanceOffsetKm: firstLegDistance,
            distanceAnchorElapsedSeconds: secondsInHour,
        });

        expect(firstLegDistance).toBeCloseTo(10, 4);
        expect(totalDistance).toBeCloseTo(
            firstLegDistance + secondLegSpeedKmh,
            4
        );
    });
});
