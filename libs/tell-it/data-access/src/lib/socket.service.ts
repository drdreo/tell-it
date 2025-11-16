import { inject, Injectable, computed, effect } from "@angular/core";
import { Router } from "@angular/router";
import { HomeInfo, UserLeft, UserOverview } from "@tell-it/domain/api-interfaces";
import { GameStatus, StoryData } from "@tell-it/domain/game";
import {
    MessageType,
    WebSocketMessage,
    UsersUpdateData,
    GameStatusData,
    StoryUpdateData,
    FinishVoteUpdateData,
    FinalStoriesData,
    UserLeftData,
    SubmitTextData,
    VoteKickData,
    RoomListUpdateData,
    GetRoomListResultData,
    JoinRoomResult,
    ReconnectResult
} from "@tell-it/domain/socket-interfaces";
import { map, Observable, Subject, tap } from "rxjs";
import { WebSocketClient } from "./websocket-client.service";

export interface ConnectionState {
    status: "connected" | "disconnected" | "reconnecting";
    attemptNumber: number;
}

@Injectable({
    providedIn: "root"
})
export class SocketService {
    private router = inject(Router);
    private ws = inject(WebSocketClient);

    // Expose WebSocket client signals
    readonly clientId = this.ws.clientId;
    readonly roomId = this.ws.roomId;
    readonly connectionStatus = this.ws.connectionStatus;
    readonly isConnected = this.ws.isConnected;
    readonly reconnectAttempts = this.ws.reconnectAttempts;

    // Computed connection state for backward compatibility
    readonly connectionState = computed<ConnectionState>(() => ({
        status: this.isConnected() ? "connected" : this.reconnectAttempts() > 0 ? "reconnecting" : "disconnected",
        attemptNumber: this.reconnectAttempts()
    }));

    // Specific event subjects
    joined$ = new Subject<JoinRoomResult>();
    reconnected$ = new Subject<ReconnectResult>();

    constructor() {
        this.ws.messages$.subscribe(msg => {
            if (
                (msg.type === "error" ||
                    msg.type === "create_room_result" ||
                    msg.type === "join_room_result" ||
                    msg.type === "leave_room_result" ||
                    msg.type === "add_bot_result" ||
                    msg.type === "reconnect_result") &&
                !msg.success
            ) {
                this.handleErrorMessage(msg);
            }
        });

        // Handle successful join/reconnect events
        this.ws.successMessages$.subscribe(msg => {
            this.handleSuccessMessage(msg);
        });

        // Auto-connect on service initialization
        this.ws.connect();
    }

    /**
     * Helper to listen for specific message types from Golang backend
     */
    private fromMessage<T>(messageType: MessageType): Observable<T> {
        return this.ws.fromMessageType<T>(messageType);
    }

    /**
     * Helper to send messages to Golang backend
     */
    private sendMessage(type: MessageType, data?: any): void {
        const message: WebSocketMessage = {
            type,
            ...(data !== undefined && { data })
        };
        this.ws.send(message);
    }

    private handleErrorMessage(message: WebSocketErrorEvent) {
        console.error("Game error:", message.error);
        switch (message.type) {
            case "error":
                console.error("Socket error:", message.error);
                // this.notificationService.notify(message.error, { autoClose: 3500 });
                break;
            case "reconnect_result":
                this.clientId.set(null);
                this.roomId.set(null);
                this.router.navigate(["/"]);
                break;
            default:
                console.log("Unknown room message type:", message.type);
        }
    }

    private handleSuccessMessage(event: WebSocketSuccessEvent): void {
        switch (event.type) {
            case MessageType.LeaveRoomResult:
                this.router.navigate(["/"]); // Navigate to home
                break;
            case MessageType.JoinRoomResult:
                if (event.data) {
                    this.handleJoinRoom(event.data);
                    this.joined$.next(event.data);
                }
                break;
            case MessageType.ReconnectResult:
                if (event.data) {
                    this.handleJoinRoom(event.data);
                    this.reconnected$.next(event.data);
                }
                break;
        }
    }

    /**
     * Handle join/reconnect room data
     */
    private handleJoinRoom(data: JoinRoomResult): void {
        if (!data) {
            console.warn("Received join_room_result with no data");
            return;
        }

        if (!data.clientId) {
            console.warn("join_room_result message missing clientId:", data);
            return;
        }

        if (!data.roomId) {
            console.warn("join_room_result message missing roomId:", data);
            return;
        }

        console.log("Joined room:", data.roomId, "with clientId:", data.clientId);
        this.ws.clientId.set(data.clientId);
        this.ws.roomId.set(data.roomId);
    }

    connect(): void {
        console.log("Manually initiating connection");
        this.ws.connect();
    }

    disconnect(): void {
        this.ws.disconnect();
    }

    getRoomList(): void {
        this.sendMessage(MessageType.GetRoomList, { gameType: "tellit" });
    }

    getHomeInfo(): Observable<HomeInfo> {
        return this.fromMessage<GetRoomListResultData>(MessageType.RoomListUpdate).pipe(
            map(data => ({
                rooms: data.map(({ roomId, started }) => ({
                    name: roomId,
                    started
                })),
                userCount: data.reduce((sum, { playerCount }) => sum + playerCount, 0)
            }))
        );
    }

    join(roomName: string, userName?: string) {
        const message = {
            type: "join_room",
            data: {
                roomId: roomName,
                gameType: "tellit" as const,
                playerName: userName || "Spectator",
                options: {
                    spectatorsAllowed: false,
                    isPublic: true,
                    minUsers: 2,
                    maxUsers: 8,
                    afkDelay: 30000
                }
            }
        };

        this.ws.send(message);
    }

    joinAsSpectator(roomName: string) {
        // Spectator join for Golang backend
        const message = {
            type: "join_spectator",
            data: { room: roomName }
        };
        this.ws.send(message);
    }

    roomJoined(): Observable<JoinRoomResult> {
        return this.fromMessage<JoinRoomResult>(MessageType.JoinRoomResult).pipe(
            tap(data => {
                // Store session data for reconnection via signals
                console.log("Room joined - clientId:", data.clientId, "roomId:", data.roomId);
                this.ws.clientId.set(data.clientId);
                this.ws.roomId.set(data.roomId);
            })
        );
    }

    roomClosed(): Observable<void> {
        // Note: Room closed handling might be different in Golang backend
        // May come as a disconnect or special message type
        return this.ws.fromMessageType<void>("room_closed");
    }

    roomListUpdate(): Observable<RoomListUpdateData> {
        return this.fromMessage<RoomListUpdateData>(MessageType.RoomListUpdate);
    }

    // ask the server to send all relevant data again
    requestUpdate() {
        this.sendMessage(MessageType.RequestUpdate);
    }

    userLeft(): Observable<UserLeft> {
        return this.fromMessage<UserLeftData>(MessageType.UserLeft).pipe(map(data => ({ userID: data.userID })));
    }

    usersUpdate(): Observable<UserOverview[]> {
        return this.fromMessage<UsersUpdateData>(MessageType.UsersUpdate).pipe(
            tap(data => console.log("Users update:", data)),
            map(data => data.users)
        );
    }

    leave() {
        // Clear session data via signals
        this.ws.clientId.set(null);
        this.ws.roomId.set(null);

        this.disconnect();
    }

    gameStatus(): Observable<GameStatus> {
        return this.fromMessage<GameStatusData>(MessageType.GameStatus).pipe(map(data => data.status));
    }

    storyUpdate(): Observable<StoryData | undefined> {
        return this.fromMessage<StoryUpdateData>(MessageType.StoryUpdate).pipe(
            map(data => (data ? { text: data.text, author: data.author } : undefined))
        );
    }

    finishVoteUpdate(): Observable<string[]> {
        return this.fromMessage<FinishVoteUpdateData>(MessageType.FinishVoteUpdate).pipe(map(data => data.votes));
    }

    getFinalStories() {
        return this.fromMessage<FinalStoriesData>(MessageType.FinalStories).pipe(map(data => data.stories));
    }

    /********************
     * Game Actions
     ********************/

    start() {
        this.sendMessage(MessageType.Start);
    }

    voteKick(userID: string) {
        this.sendMessage(MessageType.VoteKick, { kickUserID: userID } as VoteKickData);
    }

    submitText(text: string) {
        this.sendMessage(MessageType.SubmitText, { text } as SubmitTextData);
    }

    voteFinish() {
        this.sendMessage(MessageType.VoteFinish);
    }

    fetchFinalStories() {
        this.sendMessage(MessageType.RequestStories);
    }

    restart() {
        this.sendMessage(MessageType.VoteRestart);
    }
}
