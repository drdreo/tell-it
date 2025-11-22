import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { SocketService } from "@tell-it/data-access";
import { ConnectionStatusComponent } from "@tell-it/ui";
import { fromEvent, map, merge } from "rxjs";
import { GameEndedComponent } from "./game-ended/game-ended.component";
import { GameInProgressComponent } from "./game-in-progress/game-in-progress.component";
import { RoomService } from "./room.service";
import { WaitingRoomComponent } from "./waiting-room/waiting-room.component";

@Component({
    selector: "tell-it-app-room",
    imports: [WaitingRoomComponent, GameInProgressComponent, GameEndedComponent, ConnectionStatusComponent],
    providers: [RoomService],
    templateUrl: "./room.component.html",
    styleUrls: ["./room.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomComponent {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly socketService = inject(SocketService);
    private readonly roomService = inject(RoomService);

    protected readonly roomName = signal<string>("");
    protected readonly startTime = signal<number>(0);

    protected readonly gameStatus = this.roomService.gameStatus;
    protected readonly users = this.roomService.users;
    protected readonly currentPlayer = this.roomService.currentPlayer;
    protected readonly story = this.roomService.story;
    protected readonly finishVotes = this.roomService.finishVotes;
    protected readonly restartVotes = this.roomService.restartVotes;
    protected readonly finalStories = this.roomService.finalStories;
    protected readonly turnTime = this.roomService.turnTime;
    protected readonly offline = toSignal(
        merge(fromEvent(window, "offline").pipe(map(() => true)), fromEvent(window, "online").pipe(map(() => false))),
        { initialValue: false }
    );

    protected readonly connectionState = this.socketService.connectionState;

    constructor() {
        // Handle room parameter from route
        this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
            const room = params.get("roomName");
            if (!room || room.length === 0) {
                this.router.navigate(["/"]);
            } else {
                this.roomName.set(room);
                this.loadRoom(room);
            }
        });
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

    voteRestart() {
        this.roomService.voteRestart();
    }

    reconnect() {
        this.socketService.connect();
    }

    private loadRoom(roomId: string): void {
        console.log("Loading room:", roomId);
        this.startTime.set(Date.now());

        this.roomService.loadRoom(roomId);
    }
}
