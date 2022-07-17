export enum RoomCommandName {
    Info = 'home_info',
    Started = 'room_started',
    Ended = 'room_ended',
    Closed = 'table_closed',

    UsersUpdate = 'users_update',
    NewRound = 'new_round',
    UserKicked = 'player_kicked'
}

export interface RoomCommand {
    name: RoomCommandName;
    recipient?: string;
    room: string;
    data?: {
        users?;
        userID?: string;
        kickedUser?: string;
    };
}
