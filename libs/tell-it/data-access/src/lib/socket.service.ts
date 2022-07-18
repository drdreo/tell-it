import { HttpClient } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { UserEvent, UserVoteKickMessage, UserJoinMessage, HomeInfo, ServerEvent, ServerJoined, UserLeft, UserOverview, ServerGameStatusUpdate, ServerUsersUpdate, UserSubmitTextMessage, ServerStoryUpdate } from '@tell-it/api-interfaces';
import { GameStatus } from '@tell-it/domain/game';
import { API_URL_TOKEN } from '@tell-it/domain/tokens';
import { Socket } from 'ngx-socket-io';
import { Observable, map, merge } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SocketService {

    constructor(private http: HttpClient, private socket: Socket, @Inject(API_URL_TOKEN) private API_URL: string) {}

    getHomeInfo(): Observable<HomeInfo> {
        return merge(this.http.get<HomeInfo>(this.API_URL + '/home'), this.socket.fromEvent<HomeInfo>(ServerEvent.Info));
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

    // ask the server to send all relevant data again
    requestUpdate() {
        this.socket.emit(UserEvent.RequestUpdate);
    }

    userLeft(): Observable<UserLeft> {
        return this.socket.fromEvent<UserLeft>(ServerEvent.UserLeft);
    }

    usersUpdate(): Observable<UserOverview[]> {
        return this.socket.fromEvent<ServerUsersUpdate>(ServerEvent.UsersUpdate)
                   .pipe(map(data => data.users));
    }

    start() {
        this.socket.emit(UserEvent.Start);
    }

    voteKick(userID: string) {
        this.socket.emit(UserEvent.VoteKick, { kickUserID: userID } as UserVoteKickMessage);
    }

    leave() {
        this.socket.emit(UserEvent.Leave);
    }


    /********************
     * Game Actions
     ********************/

    gameStatus(): Observable<GameStatus> {
        return this.socket.fromEvent<ServerGameStatusUpdate>(ServerEvent.GameStatus).pipe(map(data => data.status));
    }

    submitText(text: string) {
        this.socket.emit(UserEvent.SubmitText, { text } as UserSubmitTextMessage);
    }

    storyUpdate() {
        return this.socket.fromEvent<ServerStoryUpdate>(ServerEvent.StoryUpdate).pipe(map(data => data.text));
    }
}
