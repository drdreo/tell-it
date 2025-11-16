import { GameStatus, StoryData } from "./game";
import { UserOverview } from "./api-interfaces";

// Message types matching Golang backend
export enum MessageType {
    // Server generic messages
    Welcome = "welcome",
    CreateRoomResult = "create_room_result",
    JoinRoomResult = "join_room_result",
    RoomListUpdate = "room_list_update",
    GetRoomListResult = "get_room_list_result",
    LeaveRoomResult = "leave_room_result",
    ReconnectResult = "reconnect_result",
    ClientJoined = "client_joined",
    ClientLeft = "client_left",
    RoomClosed = "room_closed",
    Error = "error",

    // Server game messages
    UsersUpdate = "users_update",
    GameStatus = "game_status",
    StoryUpdate = "story_update",
    FinishVoteUpdate = "finish_vote_update",
    FinalStories = "final_stories",
    UserLeft = "user_left",
    UserKicked = "user_kicked",

    // Client messages
    ConnectionHandshake = "connection_handshake",
    Reconnect = "reconnect",
    Start = "start",
    SubmitText = "submit_text",
    VoteFinish = "vote_finish",
    VoteRestart = "vote_restart",
    VoteKick = "vote_kick",
    RequestStories = "request_stories",
    RequestUpdate = "request_update",
    GetRoomList = "get_room_list"
}

// Generic message wrapper for Golang backend
export interface WebSocketMessage<T = any> {
    type: string;
    success?: boolean;
    data?: T;
    error?: string;
}

// Client message data structures
export interface VoteKickData {
    kickUserID: string;
}

export interface SubmitTextData {
    text: string;
}

export interface JoinRoomResult {
    roomId: string;
    clientId: string;
}

export interface ReconnectResult {
    roomId: string;
    clientId: string;
    gameType: string;
}

export interface JoinRoomData {
    gameType: "tellit";
    playerName: string;
    options?: {
        spectatorsAllowed?: boolean;
        isPublic?: boolean;
        minUsers?: number;
        maxUsers?: number;
        afkDelay?: number;
    };
}

export interface ReconnectData {
    room: string;
    clientId: string;
}

// Server message data structures
export interface JoinedData {
    userID: string;
    room: string;
}

export interface UsersUpdateData {
    users: UserOverview[];
}

export interface GameStatusData {
    status: GameStatus;
}

export interface StoryUpdateData {
    text: string;
    author: string;
}

export interface FinishVoteUpdateData {
    votes: string[];
}

export interface FinalStoriesData {
    stories: StoryData[];
}

export interface UserLeftData {
    userID: string;
}

export interface UserKickedData {
    kickedUser: string;
}

export interface JoinRoomResultData {
    roomId: string;
    gameType: string;
    clients: number;
}

export interface RoomListUpdateData {
    roomId: string;
    playerCount: number;
    started: boolean;
}

export type GetRoomListResultData = Array<{
    roomId: string;
    playerCount: number;
    started: boolean;
}>;

export interface UserSubmitTextMessage {
    text: string;
}

export interface UserJoinMessage {
    roomName: string;
    userName: string;
    userID?: string;
}

export interface UserSpectatorJoinMessage {
    roomName: string;
}

export interface ServerSpectatorJoined {
    room: string;
}

export interface ServerGameStatusUpdate {
    status: GameStatus;
}

export interface ServerUsersUpdate {
    users: UserOverview[];
}

export type ServerStoryUpdate = StoryData;

export interface ServerFinishVoteUpdate {
    votes: string[];
}

export interface ServerFinalStories {
    stories: StoryData[];
}
