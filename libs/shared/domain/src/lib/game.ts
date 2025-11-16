export enum GameStatus {
    Waiting = "waiting",
    Started = "started",
    Ended = "ended"
}

export type StoryData = {
    text: string;
    author: string;
};

export type UserOverview = {
    id: string;
    name: string;
    disconnected: boolean;
    afk: boolean;
    kickVotes: string[];
    queuedStories: number;
};

export type RoomConfig = {
    spectatorsAllowed: boolean;
    isPublic: boolean;
    minUsers?: number;
    maxUsers?: number;
    afkDelay?: number;
};
