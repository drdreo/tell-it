import { GameStatus, StoryData } from "./game";
import { UserOverview } from "./api-interfaces";

export enum ServerEvent {
    Info = "server:info",
    Joined = "server:user:joined",

    UserLeft = "server:user:left",
    UserKick = "server:user:kicked",
    UsersUpdate = "server:users:update",

    RoomClosed = "server:room:closed",

    GameStatus = "server:game:status",
    StoryUpdate = "server:game:story:update",
    VoteFinish = "server:game:vote:finish",
    FinalStories = "server:game:stories"
}

export enum UserEvent {
    JoinRoom = "client:user:join",
    Start = "client:user:start",
    SpectatorJoin = "client:spectator:join",
    Leave = "client:user:leave",
    VoteKick = "client:user:vote-kick",
    VoteFinish = "client:user:vote-finish",
    VoteRestart = "client:user:vote-restart",
    SubmitText = "client:user:submit-text",
    RequestStories = "client:request:stories",
    RequestUpdate = "client:request:update"
}

export interface UserVoteKickMessage {
    kickUserID: string;
}

export interface UserSubmitTextMessage {
    text: string;
}

export interface UserJoinMessage {
    roomName: string;
    userName: string;
    userID?: string; // if the user already existed, the client has its user ID
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
