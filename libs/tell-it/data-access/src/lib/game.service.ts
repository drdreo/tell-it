import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { GameStatus, StoryData } from "@tell-it/domain/game";
import { filter } from "rxjs";
import { SocketService } from "./socket.service";

function isStoryEqual(a: StoryData | undefined, b: StoryData | undefined): boolean {
    return a?.author === b?.author && a?.text === b?.text;
}

@Injectable({
    providedIn: "root"
})
export class GameService {
    private readonly router = inject(Router);
    private readonly socketService = inject(SocketService);

    // Game state signals
    users = toSignal(this.socketService.usersUpdate(), { initialValue: [] });

    gameStatus = toSignal(this.socketService.gameStatus(), { initialValue: GameStatus.Waiting });

    story = toSignal(
        this.socketService.storyUpdate().pipe(
            filter((story): story is StoryData => story !== undefined)
        ),
        { equal: isStoryEqual }
    );

    finishVotes = toSignal(this.socketService.finishVoteUpdate(), { initialValue: [] });

    finalStories = toSignal(this.socketService.getFinalStories(), { initialValue: [] });

    // Computed values
    currentPlayer = computed(() => {
        const clientId = this.socketService.clientId();
        const users = this.users();
        if (!clientId || !users) return undefined;
        return users.find((user) => user.id === clientId);
    });

    // Turn timer signal
    turnTime = signal<number | undefined>(undefined);
    private turnTimerInterval: any;

    constructor() {
        // Handle room closed
        this.socketService.roomClosed().subscribe(() => {
            console.log("Room closed, navigating to home");
            this.router.navigate(["/"]);
        });

        // Handle user left
        this.socketService.userLeft().subscribe(({ userID }) => {
            console.log("User left:", userID);
        });

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

    // Room actions
    joinRoom(roomName: string, userName: string): void {
        this.socketService.join(roomName, userName);
    }

    joinAsSpectator(roomName: string): void {
        this.socketService.joinAsSpectator(roomName);
    }

    leaveRoom(): void {
        this.endTurnTimer();
        this.socketService.leave();
    }

    requestRoomList(): void {
        this.socketService.getRoomList();
    }

    // Game actions
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

    restart(): void {
        this.socketService.restart();
    }

    voteKick(userID: string): void {
        this.socketService.voteKick(userID);
    }

    requestUpdate(): void {
        this.socketService.requestUpdate();
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

