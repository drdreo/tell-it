import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { GameService, SocketService } from "@tell-it/data-access";
import { fromEvent, map, merge } from "rxjs";
import { ConnectionStatusComponent } from "./connection-status/connection-status.component";
import { GameEndedComponent } from "./game-ended/game-ended.component";
import { GameInProgressComponent } from "./game-in-progress/game-in-progress.component";
import { WaitingRoomComponent } from "./waiting-room/waiting-room.component";

@Component({
    selector: "tell-it-app-room",
    templateUrl: "./room.component.html",
    styleUrls: ["./room.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [WaitingRoomComponent, GameInProgressComponent, GameEndedComponent, ConnectionStatusComponent]
})
export class RoomComponent implements OnInit {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private socketService = inject(SocketService);
    protected gameService = inject(GameService);

    // Room info
    protected readonly roomName = signal<string>("");
    protected readonly startTime = signal<number>(0);

    // Game state from GameService (signals)
    protected readonly gameStatus = this.gameService.gameStatus;
    protected readonly users = this.gameService.users;
    protected readonly currentPlayer = this.gameService.currentPlayer;
    protected readonly story = this.gameService.story;
    protected readonly finishVotes = this.gameService.finishVotes;
    protected readonly finalStories = this.gameService.finalStories;
    protected readonly turnTime = this.gameService.turnTime;

    // Connection state
    protected readonly connectionState = this.socketService.connectionState;
    protected readonly offline = toSignal(
        merge(
            fromEvent(window, "offline").pipe(map(() => true)),
            fromEvent(window, "online").pipe(map(() => false))
        ),
        { initialValue: false }
    );

    constructor() {
        // Handle room parameter from route
        this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
            const room = params.get("roomName");
            if (room) {
                this.roomName.set(room);
                this.loadRoom(room);
            } else {
                this.router.navigate(["/"]);
            }
        });
    }

    ngOnInit(): void {
        // Request updated data when component initializes
        this.gameService.requestUpdate();
    }

    private loadRoom(room: string): void {
        if (!room || room.length === 0) {
            console.error("Room name is empty");
            this.router.navigate(["/"]);
            return;
        }

        console.log("Loading room:", room);
        this.startTime.set(Date.now());

        // Request update from server
        this.gameService.requestUpdate();
    }

    startGame() {
        this.gameService.startGame();
    }

    submitText(text: string) {
        if (text.length === 0) {
            return;
        }
        this.gameService.submitText(text);
    }

    voteFinish() {
        this.gameService.voteFinish();
    }

    loadFinalStories() {
        this.gameService.fetchFinalStories();
    }

    restart() {
        this.gameService.restart();
    }

    reconnect() {
        this.socketService.connect();
    }
}
