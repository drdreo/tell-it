import { ChangeDetectionStrategy, Component, effect, inject, Signal } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { SocketService } from "@tell-it/data-access";
import { roomNameValidator } from "@tell-it/utils";
import { map } from "rxjs";
import { HomeInfo } from "./domain";

@Component({
    selector: "tell-it-app-home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule]
})
export class HomeComponent {
    private readonly router = inject(Router);
    private readonly socketService = inject(SocketService);
    private readonly fb = inject(FormBuilder);

    loginForm = this.fb.group({
        username: ["", [Validators.required, Validators.minLength(2)]],
        room: ["", [Validators.required, roomNameValidator(/^\w+$/i)]]
    });

    protected readonly isConnected = this.socketService.isConnected;

    protected readonly homeInfo: Signal<HomeInfo> = toSignal(
        this.socketService.roomList$().pipe(
            map(data => ({
                rooms: data.map(({ roomId, started }) => ({
                    name: roomId,
                    started
                })),
                userCount: data.reduce((sum, { playerCount }) => sum + playerCount, 0)
            }))
        ),
        {
            initialValue: { rooms: [], userCount: 0 }
        }
    );

    // Control whether user can join as player or only spectate
    protected readonly isJoinable = true;

    constructor() {
        // Request room list when connected
        effect(() => {
            const isConnected = this.isConnected();
            if (isConnected) {
                this.socketService.getRoomList();
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
            } else {
                this.socketService.leaveRoom();
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
                this.socketService.joinRoom(room, username);
            }
        }
    }

    spectateRoom() {
        if (this.loginForm.controls.room.valid) {
            const { room } = this.loginForm.value;
            if (room) {
                this.socketService.joinRoom(room);
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
