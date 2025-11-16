export interface RoomInfo {
    name: string;
    started: boolean;
}

export interface HomeInfo {
    rooms: RoomInfo[];
    userCount: number;
}
