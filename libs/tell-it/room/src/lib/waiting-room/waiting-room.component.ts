import { ChangeDetectionStrategy, Component, output, input } from "@angular/core";
import { UserOverview } from "@tell-it/domain/api-interfaces";

@Component({
    selector: "tell-it-waiting-room",
    templateUrl: "./waiting-room.component.html",
    styleUrls: ["./waiting-room.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: []
})
export class WaitingRoomComponent {
    readonly roomName = input.required<string>();
    readonly users = input<UserOverview[] | null | undefined>([]);
    readonly user = input<UserOverview | null | undefined>(null);
    readonly startGame = output<void>();
}
