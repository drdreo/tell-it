export enum GameStatus {
    Waiting = 'waiting',
    Started = 'started',
    Ended = 'ended',
}

export interface StoryData {
    ownerId: string; // the original owner of the story
    userId: string; // the current user who needs to change the story
    getAllTexts(): string[];
}
