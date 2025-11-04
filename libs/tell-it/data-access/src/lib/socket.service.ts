import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { HomeInfo, ServerJoined, UserLeft, UserOverview } from "@tell-it/domain/api-interfaces";
import { GameStatus, StoryData } from "@tell-it/domain/game";
import {
    ServerEvent,
    ServerFinalStories,
    ServerFinishVoteUpdate,
    ServerGameStatusUpdate,
    ServerStoryUpdate,
    ServerUsersUpdate,
    UserEvent,
    UserJoinMessage,
    UserSubmitTextMessage,
    UserVoteKickMessage
} from "@tell-it/domain/socket-interfaces";
import { API_URL_TOKEN } from "@tell-it/domain/tokens";
import { Socket } from "ngx-socket-io";
import { BehaviorSubject, map, merge, Observable, tap } from "rxjs";

export interface ConnectionState {
    status: "connected" | "disconnected" | "reconnecting";
    attemptNumber: number;
}

@Injectable({
    providedIn: "root"
})
export class SocketService {
    private http = inject(HttpClient);
    private socket = inject(Socket);
    private API_URL = inject(API_URL_TOKEN);

    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: any = null;
    private connectionState$ = new BehaviorSubject<ConnectionState>({
        status: "connected",
        attemptNumber: 0
    });

    constructor() {
        // Set up automatic reconnection handling
        this.disconnected().subscribe(() => {
            this.handleDisconnection();
        });

        this.connected().subscribe(() => {
            this.handleReconnection();
        });
    }

    getConnectionState(): Observable<ConnectionState> {
        return this.connectionState$.asObservable();
    }

    private handleDisconnection(): void {
        console.log("WebSocket disconnected");
        this.connectionState$.next({
            status: "reconnecting",
            attemptNumber: 0
        });
        this.attemptReconnect();
    }

    private handleReconnection(): void {
        console.log("WebSocket reconnected successfully");
        this.reconnectAttempts = 0;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.connectionState$.next({
            status: "connected",
            attemptNumber: 0
        });

        // Request updated data from server after reconnection
        this.requestUpdate();
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log("Max reconnection attempts reached");
            this.connectionState$.next({
                status: "disconnected",
                attemptNumber: this.reconnectAttempts
            });
            return;
        }

        this.reconnectAttempts++;
        const backoffDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);

        console.log(`Reconnection attempt ${this.reconnectAttempts} in ${backoffDelay}ms`);
        this.connectionState$.next({
            status: "reconnecting",
            attemptNumber: this.reconnectAttempts
        });

        this.reconnectTimeout = setTimeout(() => {
            if (!this.socket.ioSocket.connected) {
                this.connect();
                // Schedule next attempt if this one fails
                setTimeout(() => {
                    if (!this.socket.ioSocket.connected) {
                        this.attemptReconnect();
                    }
                }, 2000);
            }
        }, backoffDelay);
    }

    connect(): void {
        console.log("Manually initiating connection");
        this.reconnectAttempts = 0; // Reset attempts on manual reconnect
        this.connectionState$.next({
            status: "reconnecting",
            attemptNumber: 0
        });
        this.socket.connect();
    }

    disconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.reconnectAttempts = 0;
        this.socket.disconnect();
    }

    connected(): Observable<any> {
        return this.socket.fromEvent("connect");
    }

    disconnected(): Observable<any> {
        return this.socket.fromEvent("disconnect");
    }

    getHomeInfo(): Observable<HomeInfo> {
        return merge(
            this.http.get<HomeInfo>(this.API_URL + "/home"),
            this.socket.fromEvent<HomeInfo>(ServerEvent.Info)
        );
    }

    join(roomName: string, userName?: string, userID?: string) {
        this.socket.emit(UserEvent.JoinRoom, { userName, roomName, userID } as UserJoinMessage);
    }

    joinAsSpectator(roomName: string) {
        this.socket.emit(UserEvent.SpectatorJoin, { roomName });
    }

    roomJoined(): Observable<ServerJoined> {
        return this.socket.fromEvent<ServerJoined>(ServerEvent.Joined);
    }

    roomClosed(): Observable<void> {
        return this.socket.fromEvent<void>(ServerEvent.RoomClosed);
    }

    // ask the server to send all relevant data again
    requestUpdate() {
        this.socket.emit(UserEvent.RequestUpdate);
    }

    userLeft(): Observable<UserLeft> {
        return this.socket.fromEvent<UserLeft>(ServerEvent.UserLeft);
    }

    usersUpdate(): Observable<UserOverview[]> {
        return this.socket.fromEvent<ServerUsersUpdate>(ServerEvent.UsersUpdate).pipe(
            tap(console.log),
            map(data => data.users)
        );
    }

    leave() {
        this.socket.emit(UserEvent.Leave);
    }

    gameStatus(): Observable<GameStatus> {
        return this.socket.fromEvent<ServerGameStatusUpdate>(ServerEvent.GameStatus).pipe(map(data => data.status));
    }

    storyUpdate(): Observable<StoryData | undefined> {
        return this.socket.fromEvent<ServerStoryUpdate | undefined>(ServerEvent.StoryUpdate);
    }

    finishVoteUpdate(): Observable<string[]> {
        return this.socket.fromEvent<ServerFinishVoteUpdate>(ServerEvent.VoteFinish).pipe(map(data => data.votes));
    }

    getFinalStories() {
        return this.socket.fromEvent<ServerFinalStories>(ServerEvent.FinalStories).pipe(map(data => data.stories));
    }

    /********************
     * Game Actions
     ********************/

    start() {
        this.socket.emit(UserEvent.Start);
    }

    voteKick(userID: string) {
        this.socket.emit(UserEvent.VoteKick, { kickUserID: userID } as UserVoteKickMessage);
    }

    submitText(text: string) {
        this.socket.emit(UserEvent.SubmitText, { text } as UserSubmitTextMessage);
    }

    voteFinish() {
        this.socket.emit(UserEvent.VoteFinish);
    }

    fetchFinalStories() {
        this.socket.emit(UserEvent.RequestStories);
    }

    restart() {
        this.socket.emit(UserEvent.VoteRestart);
    }
}
