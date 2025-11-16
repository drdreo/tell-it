import { computed, inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import {
    FinalStoriesData,
    FinishVotesData,
    GameStatus,
    GameStatusData,
    JoinRoomSuccessData,
    RequestUpdateAction,
    RoomConfig,
    RoomListData,
    StoryData,
    StoryData_Event,
    UserOverview,
    UsersData,
    WebSocketAction,
    WebSocketErrorEvent,
    WebSocketSuccessEvent
} from "@tell-it/domain";
import { map, Observable, Subject } from "rxjs";
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
    joined$ = new Subject<JoinRoomSuccessData>();
    reconnected$ = new Subject<JoinRoomSuccessData>();

    constructor() {
        this.ws.messages$.subscribe(msg => {
            if (!msg.success) {
                this.handleErrorMessage(msg);
            } else {
                this.handleSuccessMessage(msg);
            }
        });

        // Auto-connect on service initialization
        this.ws.connect();

        // Handle room closed - navigate to home
        this.roomClosed().subscribe(() => {
            console.log("Room closed, navigating to home");
            this.router.navigate(["/"]);
        });
    }

    /**
     * Helper to send WebSocket actions with proper typing
     */
    private sendAction(action: WebSocketAction): void {
        this.ws.send(action);
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
            case "leave_room_result":
                this.router.navigate(["/"]); // Navigate to home
                break;
            case "join_room_result":
                this.handleJoinRoom(event.data);
                this.joined$.next(event.data);
                break;
            case "reconnect_result":
                this.handleJoinRoom(event.data);
                this.reconnected$.next(event.data);
                break;
        }
    }

    /**
     * Handle join/reconnect room data
     */
    private handleJoinRoom(data: JoinRoomSuccessData): void {
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
        this.sendAction({ type: "get_room_list", data: { gameType: "tellit" } });
    }

    roomList$(): Observable<RoomListData> {
        return this.ws.fromMessageType<RoomListData>("room_list_update");
    }

    joinRoom(roomName: string, userName?: string) {
        this.sendAction({
            type: "join_room",
            data: {
                gameType: "tellit",
                roomId: roomName,
                playerName: userName || "Spectator",
                options: {
                    spectatorsAllowed: false,
                    isPublic: true,
                    minUsers: 2,
                    maxUsers: 8,
                    afkDelay: 30000
                } satisfies RoomConfig
            }
        });
    }

    roomJoined(): Observable<JoinRoomSuccessData> {
        return this.ws.fromMessageType<JoinRoomSuccessData>("join_room_result");
    }

    leaveRoom(): void {
        this.sendAction({ type: "leave_room" });
        this.leave();
    }

    roomClosed(): Observable<void> {
        // Note: Room closed handling might be different in Golang backend
        // May come as a disconnect or special message type
        return this.ws.fromMessageType<void>("room_closed");
    }

    requestUpdate() {
        this.sendAction({ type: "request_update" } satisfies RequestUpdateAction);
    }

    usersUpdate(): Observable<UserOverview[]> {
        return this.ws.fromMessageType<UsersData>("users_update").pipe(map(data => data.users));
    }

    leave() {
        this.ws.clientId.set(null);
        this.ws.roomId.set(null);
    }

    gameStatus(): Observable<GameStatus> {
        return this.ws.fromMessageType<GameStatusData>("game_status").pipe(map(data => data.status));
    }

    storyUpdate(): Observable<StoryData | undefined> {
        return this.ws
            .fromMessageType<StoryData_Event>("story_update")
            .pipe(map(data => (data ? { text: data.text, author: data.author } : undefined)));
    }

    finishVoteUpdate(): Observable<string[]> {
        return this.ws.fromMessageType<FinishVotesData>("finish_vote_update").pipe(map(data => data.votes));
    }

    restartVoteUpdate(): Observable<string[]> {
        return this.ws.fromMessageType<FinishVotesData>("restart_vote_update").pipe(map(data => data.votes));
    }

    getFinalStories() {
        return this.ws.fromMessageType<FinalStoriesData>("final_stories").pipe(map(data => data.stories));
    }

    /********************
     * Game Actions
     ********************/

    start() {
        this.sendAction({ type: "start" });
    }

    voteKick(userID: string) {
        this.sendAction({ type: "vote_kick", data: { kickUserID: userID } });
    }

    submitText(text: string) {
        this.sendAction({ type: "submit_text", data: { text } });
    }

    voteFinish() {
        this.sendAction({ type: "vote_finish" });
    }

    fetchFinalStories() {
        this.sendAction({ type: "request_stories" });
    }

    voteRestart() {
        this.sendAction({ type: "vote_restart" });
    }
}
