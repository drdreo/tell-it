import { GameStatus, StoryData, UserOverview } from "./game";

/**
 * WebSocket Message Types
 * All messages from server and actions to server
 */

export type RoomListData = {
    roomId: string;
    playerCount: number;
    started: boolean;
}[];

export type UsersData = {
    users: UserOverview[];
};

export type GameStatusData = {
    status: GameStatus;
};

export type StoryData_Event = {
    text: string;
    author: string;
};

export type FinishVotesData = {
    votes: string[];
};

export type FinalStoriesData = {
    stories: StoryData[];
};

export type UserIdData = {
    clientId: string;
};

export type WebSocketSuccessEvent =
    | WelcomeEvent
    | JoinRoomSuccessEvent
    | LeaveRoomSuccessEvent
    | ReconnectSuccessEvent
    | RoomListUpdateEvent
    | ClientJoinedEvent
    | ClientLeftEvent
    | RoomClosedEvent
    // Game-specific events
    | UsersUpdateEvent
    | GameStatusEvent
    | StoryUpdateEvent
    | FinishVoteUpdateEvent
    | FinalStoriesEvent
    | UserKickedEvent;

export type WebSocketErrorEvent =
    | ErrorEvent
    | CreateRoomFailureEvent
    | JoinRoomFailureEvent
    | LeaveRoomFailureEvent
    | ReconnectFailureEvent;

export type WebSocketMessage = WebSocketSuccessEvent | WebSocketErrorEvent;

export type WebSocketAction =
    | JoinRoomAction
    | JoinSpectatorAction
    | LeaveRoomAction
    | ReconnectAction
    | GetRoomListAction
    | StartGameAction
    | SubmitTextAction
    | VoteFinishAction
    | VoteRestartAction
    | VoteKickAction
    | RequestStoriesAction
    | RequestUpdateAction;

/**
 * Success Events
 */
export type WelcomeEvent = {
    type: "welcome";
    success: true;
    data: {
        message: string;
    };
};

export type JoinRoomSuccessData = {
    roomId: string;
    clientId: string;
};
export type JoinRoomSuccessEvent = {
    type: "join_room_result";
    success: true;
    data: JoinRoomSuccessData;
};

export type LeaveRoomSuccessEvent = {
    type: "leave_room_result";
    success: true;
    data: null;
};

export type ReconnectSuccessEvent = {
    type: "reconnect_result";
    success: true;
    data: JoinRoomSuccessData;
};

export type RoomListUpdateEvent = {
    type: "room_list_update";
    success: true;
    data: RoomListData;
};

export type ClientJoinedEvent = {
    type: "client_joined";
    success: true;
    data: {
        clientId: string;
    };
};

export type ClientLeftEvent = {
    type: "client_left";
    success: true;
    data: UserIdData;
};

export type RoomClosedEvent = {
    type: "room_closed";
    success: true;
    data: {
        roomId: string;
    };
};

/**
 * Game-specific Success Events
 */
export type UsersUpdateEvent = {
    type: "users_update";
    success: true;
    data: UsersData;
};

export type GameStatusEvent = {
    type: "game_status";
    success: true;
    data: GameStatusData;
};

export type StoryUpdateEvent = {
    type: "story_update";
    success: true;
    data: StoryData_Event;
};

export type FinishVoteUpdateEvent = {
    type: "finish_vote_update";
    success: true;
    data: FinishVotesData;
};

export type FinalStoriesEvent = {
    type: "final_stories";
    success: true;
    data: FinalStoriesData;
};

export type UserKickedEvent = {
    type: "user_kicked";
    success: true;
    data: {
        kickedUser: string;
    };
};

/**
 * Error Events
 */
export type CreateRoomFailureEvent = {
    type: "create_room_result";
    success: false;
    error: string;
};

export type JoinRoomFailureEvent = {
    type: "join_room_result";
    success: false;
    error: string;
};

export type LeaveRoomFailureEvent = {
    type: "leave_room_result";
    success: false;
    error: string;
};

export type ReconnectFailureEvent = {
    type: "reconnect_result";
    success: false;
    error: string;
};

export type ErrorEvent = {
    type: "error";
    success: false;
    error: string;
};

/**
 * Client Actions
 */
export type JoinRoomAction = {
    type: "join_room";
    data: {
        gameType: "tellit";
        roomId: string | undefined;
        playerName: string;
        options?: {
            spectatorsAllowed?: boolean;
            isPublic?: boolean;
            minUsers?: number;
            maxUsers?: number;
            afkDelay?: number;
        };
    };
};

export type JoinSpectatorAction = {
    type: "join_spectator";
    data: {
        room: string;
    };
};

export type LeaveRoomAction = {
    type: "leave_room";
};

export type ReconnectAction = {
    type: "reconnect";
    data: {
        roomId: string;
        clientId: string;
    };
};

export type GetRoomListAction = {
    type: "get_room_list";
    data: {
        gameType: "tellit";
    };
};

export type StartGameAction = {
    type: "start";
};

export type SubmitTextAction = {
    type: "submit_text";
    data: {
        text: string;
    };
};

export type VoteFinishAction = {
    type: "vote_finish";
};

export type VoteRestartAction = {
    type: "vote_restart";
};

export type VoteKickAction = {
    type: "vote_kick";
    data: {
        kickUserID: string;
    };
};

export type RequestStoriesAction = {
    type: "request_stories";
};

export type RequestUpdateAction = {
    type: "request_update";
};
