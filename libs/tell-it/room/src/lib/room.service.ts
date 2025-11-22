import { computed, effect, inject, Injectable, OnDestroy, signal } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { SocketService } from "@tell-it/data-access";
import { GameStatus, StoryData, UserOverview } from "@tell-it/domain";

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

    readonly users = toSignal(this.socketService.usersUpdate().pipe(takeUntilDestroyed()), {
        initialValue: [] as UserOverview[]
    });
    readonly gameStatus = toSignal(this.socketService.gameStatus().pipe(takeUntilDestroyed()), {
        initialValue: GameStatus.Waiting as GameStatus
    });
    readonly story = toSignal(this.socketService.storyUpdate().pipe(takeUntilDestroyed()), { equal: isStoryEqual });
    readonly finishVotes = toSignal(this.socketService.finishVoteUpdate().pipe(takeUntilDestroyed()), {
        initialValue: []
    });
    readonly restartVotes = toSignal(this.socketService.restartVoteUpdate().pipe(takeUntilDestroyed()), {
        initialValue: []
    });
    readonly finalStories = toSignal(this.socketService.getFinalStories().pipe(takeUntilDestroyed()), {
        initialValue: []
    });

    readonly currentPlayer = computed(() => {
        const clientId = this.socketService.clientId();
        const users = this.users();
        if (!clientId || !users) return undefined;
        return users.find(user => user.id === clientId);
    });

    readonly turnTime = signal<number | undefined>(undefined);
    private turnTimerInterval: ReturnType<typeof setInterval> | undefined;

    constructor() {
        // Start turn timer when story updates with text
        effect(() => {
            const story = this.story();
            if (story?.text && story.text.length > 0) {
                this.startTurnTimer();
            }
        });
    }

    ngOnDestroy(): void {
        this.endTurnTimer();
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
        const isPlayer = currentUsers?.find(user => user.id === clientId);
        const disconnected = isPlayer?.disconnected || false;

        if (disconnected) {
            console.log("Player was disconnected. Attempting to reconnect!");
            this.socketService.joinRoom(roomId, undefined);
        } else if (!isPlayer && currentUsers && currentUsers.length > 0) {
            console.log("Joining as spectator!");
            this.socketService.joinRoom(roomId);
        }

        this.socketService.requestUpdate();
    }

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
