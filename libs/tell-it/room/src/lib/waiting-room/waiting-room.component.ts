import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";
import { UserOverview } from "@tell-it/domain";
import { TellItUserListComponent } from "@tell-it/ui";

@Component({
    selector: "tell-it-waiting-room",
    templateUrl: "./waiting-room.component.html",
    styleUrls: ["./waiting-room.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TellItUserListComponent]
})
export class WaitingRoomComponent {
    readonly roomName = input.required<string>();
    readonly users = input<UserOverview[] | null | undefined>([]);
    readonly user = input<UserOverview | null | undefined>(null);
    readonly startGame = output<void>();

    isLeader = computed(() => {
        const user = this.user();
        const users = this.users();
        return user && users && users.length > 1 && user.id === users[0].id;
    });
}
