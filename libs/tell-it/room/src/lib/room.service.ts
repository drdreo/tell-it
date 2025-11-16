import { inject, Injectable, OnDestroy } from "@angular/core";
import { SocketService } from "@tell-it/data-access";
import { UserOverview } from "@tell-it/domain/api-interfaces";
import { GameStatus, StoryData } from "@tell-it/domain/game";
import {
    BehaviorSubject,
    distinctUntilChanged,
    interval,
    map,
    Observable,
    ReplaySubject,
    Subject,
    takeUntil,
    tap
} from "rxjs";

function isStoryEqual(a: StoryData | undefined, b: StoryData | undefined): boolean {
    return a?.author === b?.author && a?.text === b?.text;
}

@Injectable()
export class RoomService implements OnDestroy {
    private socketService = inject(SocketService);

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

    constructor() {
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

    /**
     * Get room updates for a specific room from the socket connection.
     * Useful for tracking room state changes (player count, started status).
     */
    getRoomUpdates(roomId: string) {
        return this.socketService.roomListUpdate().pipe(
            map(update => (update.roomId === roomId ? update : null)),
            tap(update => {
                if (update) {
                    console.log("Room update:", update);
                }
            })
        );
    }

    async loadRoom(room: string): Promise<{ startTime: number }> {
        console.log("Loading room:", room);

        if (!room || room.length === 0) {
            throw new Error("Room name is empty");
        }

        // Check if the current user is already in the room
        const currentUsers = this._users$.value;
        const isPlayer = currentUsers.find(user => user.id === this.clientPlayerID);
        const disconnected = isPlayer?.disconnected || false;

        if (disconnected) {
            console.log("Player was disconnected. Try to reconnect!");
            // reconnect if loading site directly
            this.socketService.join(room, undefined);
        } else if (!isPlayer && currentUsers.length > 0) {
            console.log("Joining as spectator!");
            // if a new user just joined the table without being at the home screen, join as spectator
            this.socketService.joinAsSpectator(room);
        }

        // Request updated data from server
        this.socketService.requestUpdate();

        // Since we no longer have startTime from HTTP response,
        // we'll track it from when the room is loaded
        // If you need the actual game start time, it should come from a socket message
        return { startTime: 0 };
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
