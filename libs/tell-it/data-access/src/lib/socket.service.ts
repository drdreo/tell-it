import { HttpClient } from "@angular/common/http";
import { Injectable, Inject } from "@angular/core";
import { UserEvent, UserVoteKickMessage, UserJoinMessage, HomeInfo, ServerEvent, ServerJoined, UserLeft, UserOverview, ServerGameStatusUpdate, ServerUsersUpdate, UserSubmitTextMessage, ServerStoryUpdate, ServerFinishVoteUpdate, ServerFinalStories } from "@tell-it/api-interfaces";
import { GameStatus, StoryData } from "@tell-it/domain/game";
import { API_URL_TOKEN } from "@tell-it/domain/tokens";
import { Socket } from "ngx-socket-io";
import { Observable, map, merge } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class SocketService {

	constructor(private http: HttpClient, private socket: Socket, @Inject(API_URL_TOKEN) private API_URL: string) {}

	getHomeInfo(): Observable<HomeInfo> {
		return merge(this.http.get<HomeInfo>(this.API_URL + "/home"), this.socket.fromEvent<HomeInfo>(ServerEvent.Info));
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
}
