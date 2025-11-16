import { computed, effect, inject, Injectable, OnDestroy, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { SocketService } from "@tell-it/data-access";
import { GameStatus, StoryData } from "@tell-it/domain";
import { filter, map, Observable, Subject, takeUntil, tap } from "rxjs";

function isStoryEqual(a: StoryData | undefined, b: StoryData | undefined): boolean {
    return a?.author === b?.author && a?.text === b?.text;
}

/**
 * RoomService manages room-specific state and lifecycle.
 * This is a room-scoped service that should be provided at the room component level.

 */
@Injectable()
export class RoomService implements OnDestroy {
    private readonly socketService = inject(SocketService);
    private readonly destroy$ = new Subject<void>();

    // Room state signals
    readonly users = toSignal(this.socketService.usersUpdate().pipe(takeUntil(this.destroy$)), { initialValue: [] });

    readonly gameStatus = toSignal(this.socketService.gameStatus().pipe(takeUntil(this.destroy$)), {
        initialValue: GameStatus.Waiting
    });

    readonly story = toSignal(
        this.socketService.storyUpdate().pipe(
            filter((story): story is StoryData => story !== undefined),
            tap(story => console.log("Story update:", story)),
            takeUntil(this.destroy$)
        ),
        { equal: isStoryEqual }
    );

    readonly finishVotes = toSignal(this.socketService.finishVoteUpdate().pipe(takeUntil(this.destroy$)), {
        initialValue: []
    });

    readonly finalStories = toSignal(this.socketService.getFinalStories().pipe(takeUntil(this.destroy$)), {
        initialValue: []
    });

    // Computed values
    readonly currentPlayer = computed(() => {
        const clientId = this.socketService.clientId();
        const users = this.users();
        if (!clientId || !users) return undefined;
        return users.find(user => user.id === clientId);
    });

    readonly isCurrentPlayerTurn = computed(() => {
        const story = this.story();
        const currentPlayer = this.currentPlayer();
        return story?.author === currentPlayer?.id;
    });

    // Turn timer state
    readonly turnTime = signal<number | undefined>(undefined);
    private turnTimerInterval: any;

    constructor() {
        // Start turn timer when story updates with text
        effect(() => {
            const story = this.story();
            if (story?.text && story.text.length > 0) {
                this.startTurnTimer();
            }
        });

        // Log game status changes
        effect(() => {
            const status = this.gameStatus();
            console.log("Game status changed:", status);
        });
    }

    ngOnDestroy(): void {
        this.endTurnTimer();
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Load and initialize the room
     */
    async loadRoom(roomId: string): Promise<void> {
        console.log("Loading room:", roomId);

        if (!roomId || roomId.length === 0) {
            throw new Error("Room name is empty");
        }

        // Check if the current user is already in the room
        const currentUsers = this.users();
        const clientId = this.socketService.clientId();
        const isPlayer = currentUsers.find(user => user.id === clientId);
        const disconnected = isPlayer?.disconnected || false;

        if (disconnected) {
            console.log("Player was disconnected. Attempting to reconnect!");
            this.socketService.joinRoom(roomId, undefined);
        } else if (!isPlayer && currentUsers.length > 0) {
            console.log("Joining as spectator!");
            this.socketService.joinRoom(roomId);
        }

        // Request updated data from server
        this.socketService.requestUpdate();
    }

    // Game actions (delegates to SocketService)
    startGame(): void {
        this.socketService.start();
    }

    submitText(text: string): void {
        this.endTurnTimer();
        this.socketService.submitText(text);
    }

    voteFinish(): void {
        this.socketService.voteFinish();
    }

    fetchFinalStories(): void {
        this.socketService.fetchFinalStories();
    }

    voteRestart(): void {
        this.socketService.voteRestart();
    }

    voteKick(userId: string): void {
        this.socketService.voteKick(userId);
    }

    // Turn timer management
    startTurnTimer(seconds = 60): void {
        this.endTurnTimer();
        let remaining = seconds;

        this.turnTimerInterval = setInterval(() => {
            remaining--;
            if (remaining < 0) {
                this.endTurnTimer();
            } else {
                this.turnTime.set(remaining);
            }
        }, 1000);
    }

    endTurnTimer(): void {
        if (this.turnTimerInterval) {
            clearInterval(this.turnTimerInterval);
            this.turnTimerInterval = undefined;
        }
        this.turnTime.set(undefined);
    }
}
