import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { UserOverview } from "@tell-it/domain/api-interfaces";
import { SocketService } from "@tell-it/data-access";
import { GameStatus, StoryData } from "@tell-it/domain/game";
import { Subject, takeUntil, Observable, fromEvent, map } from "rxjs";
import { RoomService } from "./room.service";
import { MessageComponent } from "./message/message.component";
import { AsyncPipe } from "@angular/common";

@Component({
    selector: "tell-it-app-room",
    templateUrl: "./room.component.html",
    styleUrls: ["./room.component.scss"],
    providers: [RoomService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MessageComponent, AsyncPipe]
})
export class RoomComponent implements OnInit, OnDestroy {
    /***Comes from server*/
    roomName!: string;
    startTime!: number;
    gameStatus$: Observable<GameStatus>;
    users$: Observable<UserOverview[]>;
    user$: Observable<UserOverview | undefined>;
    story$: Observable<StoryData | undefined>;
    finishVotes$: Observable<string[]>;
    finalStories$: Observable<StoryData[]>;
    turnTimer$: Observable<number | undefined>;
    /***/

    offline$: Observable<string>;
    disconnected$ = this.socketService.disconnected();

    private unsubscribe$ = new Subject<void>();

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private socketService: SocketService,
        private roomService: RoomService
    ) {
        this.gameStatus$ = this.roomService.gameStatus$;
        this.users$ = this.roomService.users$;
        this.user$ = this.roomService.user$;
        this.story$ = this.roomService.story$;
        this.finishVotes$ = this.socketService.finishVoteUpdate();
        this.finalStories$ = this.socketService.getFinalStories();
        this.turnTimer$ = this.roomService.turnTime$;

        this.offline$ = fromEvent(document, "offline").pipe(map(() => "Device offline"));
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntil(this.unsubscribe$)).subscribe(async params => {
            const room = params.get("roomName");
            this.roomName = room || "";
            try {
                const { startTime } = await this.roomService.loadRoom(this.roomName);
                this.startTime = startTime;
            } catch (e) {
                console.error(e);
                this.router.navigate(["/"]);
            }
        });

        // if the room is closed while players are on the page, redirect them to the home page
        this.socketService
            .roomClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.router.navigate(["/"]);
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    startGame() {
        this.roomService.startGame();
    }

    submitText(text: string) {
        if (text.length === 0) {
            return;
        }
        this.roomService.submitText(text);
    }

    voteFinish() {
        this.roomService.voteFinish();
    }

    loadFinalStories() {
        this.roomService.fetchFinalStories();
    }

    restart() {
        this.roomService.restart();
    }
}
