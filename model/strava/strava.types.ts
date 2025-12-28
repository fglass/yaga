export interface StravaActivityPayload {
    name: string;
    type?: string;
    sport_type: string;
    start_date_local: string;
    elapsed_time: number;
    description?: string;
    distance?: number; // In meters
    trainer?: number;
    commute?: number;
}
