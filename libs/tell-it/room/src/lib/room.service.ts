import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy, Inject } from "@angular/core";
import { UserOverview, RoomResponse } from "@tell-it/domain/api-interfaces";
import { SocketService } from "@tell-it/data-access";
import { GameStatus, StoryData } from "@tell-it/domain/game";
import { API_URL_TOKEN } from "@tell-it/domain/tokens";
import {
    BehaviorSubject,
    Observable,
    Subject,
    takeUntil,
    interval,
    map,
    firstValueFrom,
    ReplaySubject,
    distinctUntilChanged,
    tap
} from "rxjs";

function isStoryEqual(a: StoryData | undefined, b: StoryData | undefined): boolean {
    return a?.author === b?.author && a?.text === b?.text;
}

@Injectable()
export class RoomService implements OnDestroy {
    private _turnTimer$ = new Subject<number | undefined>();
    turnTime$ = this._turnTimer$.asObservable();

    private _users$: BehaviorSubject<UserOverview[]> = new BehaviorSubject<UserOverview[]>([]);
    users$: Observable<UserOverview[]> = this._users$.asObservable();

    // set if the current client is a player in the room
    user$ = this._users$.pipe(map(users => users.find(user => user.id === this.clientPlayerID)));

    private _story$ = new ReplaySubject<StoryData | undefined>(1);
    story$ = this._story$.asObservable();
    private _gameStatus$ = new BehaviorSubject<GameStatus>(GameStatus.Waiting);
    gameStatus$ = this._gameStatus$.asObservable();
    private stopTurnTimer$ = new Subject<void>();
    private unsubscribe$ = new Subject<void>();

    constructor(
        private http: HttpClient,
        private socketService: SocketService,
        @Inject(API_URL_TOKEN) private API_URL: string
    ) {
        this.socketService
            .usersUpdate()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(users => {
                this.updateUsers(users);
            });

        this.socketService
            .gameStatus()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(status => {
                this._gameStatus$.next(status);
            });

        this.socketService
            .storyUpdate()
            .pipe(
                distinctUntilChanged(isStoryEqual),
                tap(story => console.log("Story update: ", story)),
                takeUntil(this.unsubscribe$)
            )
            .subscribe(story => {
                this._story$.next(story);
                if (story) {
                    if (story.text?.length > 0) {
                        this.startTurnTimer();
                    }
                }
            });
    }

    get clientPlayerID(): string | undefined {
        return sessionStorage.getItem("playerID") || undefined;
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    startGame() {
        this.socketService.start();
    }

    startTurnTimer() {
        this.endTurnTimer();
        const seconds = 60;
        interval(1000)
            .pipe(
                map(num => seconds - num),
                takeUntil(this.stopTurnTimer$),
                takeUntil(this.unsubscribe$)
            )
            .subscribe(time => {
                if (time < 0) {
                    this.endTurnTimer();
                } else {
                    this._turnTimer$.next(time);
                }
            });
    }

    endTurnTimer() {
        this.stopTurnTimer$.next();
        this._turnTimer$.next(undefined);
    }

    updateUsers(users: UserOverview[]) {
        this._users$.next(users);
    }

    async loadRoom(room: string): Promise<{ startTime: number }> {
        console.log(room);

        if (!room || room.length === 0) {
            throw new Error("Room name is empty");
        }
        const response = await firstValueFrom(this.http.get<RoomResponse>(this.API_URL + "/room/" + room));
        const isPlayer = response.users.find(user => user.id === this.clientPlayerID);
        const disconnected = isPlayer?.disconnected || false;

        if (disconnected) {
            console.log("Player was disconnected. Try to reconnect!");
            // reconnect if loading site directly
            this.socketService.join(room, undefined, this.clientPlayerID);
        } else if (!isPlayer) {
            if (!response.config.spectatorsAllowed) {
                throw new Error("Not allowed to spectate!");
            }

            console.log("Joining as spectator!");
            // if a new user just joined the table without being at the home screen, join as spectator
            this.socketService.joinAsSpectator(room);
        }

        this.socketService.requestUpdate();

        return { startTime: new Date().getTime() - new Date(response.startTime).getTime() };
    }

    submitText(text: string) {
        this.endTurnTimer();
        this.socketService.submitText(text);
    }

    voteFinish() {
        this.socketService.voteFinish();
    }

    fetchFinalStories() {
        this.socketService.fetchFinalStories();
    }

    restart() {
        this.socketService.restart();
    }
}
