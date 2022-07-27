import { StoryData } from "@tell-it/domain/game";

export interface RoomInfo {
    name: string;
    started: boolean;
}

export interface HomeInfo {
    rooms: RoomInfo[];
    userCount: number;
}

export interface RoomResponse {
    name: string;
    users: UserOverview[];
    startTime: Date;
    config: RoomConfig;
}

export interface StoriesResponse {
    stories: {
        date: number;
        stories: StoryData[];
    }[];
}

export interface ServerJoined {
    userID: string;
    room: string;
}

export interface UserLeft {
    userID: string;
}

export interface UserKicked {
    kickedUser: string;
}

export interface UserOverview {
    id: string;
    name: string;
    disconnected: boolean;
    afk: boolean;
    kickVotes: string[];
}

export interface RoomConfig {
    spectatorsAllowed: boolean;
    isPublic: boolean;
    users?: {
        min: number;
        max: number;
    };
    afk?: {
        delay: number;
    };
}
