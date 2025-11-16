import { ChangeDetectionStrategy, Component, effect, inject } from "@angular/core";
import { FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { roomNameValidator } from "@tell-it/utils";
import { GameService, SocketService } from "@tell-it/data-access";

@Component({
    selector: "tell-it-app-home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule]
})
export class HomeComponent {
    private readonly router = inject(Router);
    private readonly gameService = inject(GameService);
    private readonly socketService = inject(SocketService);
    private readonly fb = inject(FormBuilder);

    loginForm = this.fb.group({
        username: ["", [Validators.required, Validators.minLength(2)]],
        room: ["", [Validators.required, roomNameValidator(/^\w+$/i)]]
    });

    protected readonly isConnected = this.socketService.isConnected;

    // Convert homeInfo Observable to signal
    protected readonly homeInfo = toSignal(this.socketService.getHomeInfo(), {
        initialValue: { rooms: [], userCount: 0 }
    });

    // Control whether user can join as player or only spectate
    protected readonly isJoinable = true;

    constructor() {
        // Request room list when connected
        effect(() => {
            const isConnected = this.isConnected();
            if (isConnected) {
                this.gameService.requestRoomList();
            }
        });

        // Handle successful room join
        this.socketService
            .roomJoined()
            .pipe(takeUntilDestroyed())
            .subscribe(({ roomId }) => {
                this.navigateToRoom(roomId);
            });

        // Handle reconnection to existing room
        this.socketService.reconnected$.pipe(takeUntilDestroyed()).subscribe(({ roomId }) => {
            console.log("Reconnected to room:", roomId);
            // TODO: Show notification and offer to rejoin
            const redirect = confirm("Game still in progress. Rejoin?");
            if (redirect) {
                this.navigateToRoom(roomId);
            }
        });
    }

    onRoomClick(name: string) {
        this.loginForm.patchValue({ room: name });
    }

    joinRoom() {
        if (this.loginForm.valid) {
            const { username, room } = this.loginForm.value;
            if (username && room) {
                this.gameService.joinRoom(room, username);
            }
        }
    }

    spectateRoom() {
        if (this.loginForm.controls.room.valid) {
            const { room } = this.loginForm.value;
            if (room) {
                this.gameService.joinRoom(room);
            }
        }
    }

    generateRoomName(): void {
        const randomName = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.loginForm.patchValue({ room: randomName });
    }

    private navigateToRoom(roomId: string): void {
        this.router.navigate(["/room", roomId]);
    }
}
