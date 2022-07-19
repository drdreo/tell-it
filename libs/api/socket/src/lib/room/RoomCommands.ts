import { GameStatus, StoryData } from "@tell-it/domain/game";

export enum RoomCommandName {
    Info = 'home_info',
    Closed = 'table_closed',

    UsersUpdate = 'users_update',
    NewRound = 'new_round',
    UserKicked = 'player_kicked',

    UserStoryUpdate = 'user_story_update',
    GameStatusUpdate = 'game_status_update'
}

export interface RoomCommand {
    name: RoomCommandName;
    recipient?: string;
    room: string;
    data?: {
        users?;
        userID?: string;
        kickedUser?: string;
        status?: GameStatus;
        story?: StoryData;
    };
}
