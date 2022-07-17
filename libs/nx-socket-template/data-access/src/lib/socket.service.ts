import { HttpClient } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { UserEvent, UserVoteKickMessage, UserJoinMessage, HomeInfo, ServerEvent, ServerJoined, UserLeft, UserOverview } from '@socket-template-app/api-interfaces';
import { Socket } from 'ngx-socket-io';
import { Observable, map, merge } from 'rxjs';
import { API_URL_TOKEN } from '@socket-template-app/domain/tokens';

@Injectable({
    providedIn: 'root'
})
export class SocketService {

    constructor(private http: HttpClient, private socket: Socket, @Inject(API_URL_TOKEN) private API_URL: string) {}

    getHomeInfo(): Observable<HomeInfo> {
        return merge(this.http.get<HomeInfo>(this.API_URL + '/home'), this.socket.fromEvent<HomeInfo>(ServerEvent.Info));
    }

    join(userName: string, roomName: string) {
        this.socket.emit(UserEvent.JoinRoom, { userName, roomName } as UserJoinMessage);
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
        return this.socket.fromEvent<any>(ServerEvent.UsersUpdate)
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

}
