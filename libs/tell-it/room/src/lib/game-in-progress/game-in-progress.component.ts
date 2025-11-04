import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { bootstrapStopwatch } from "@ng-icons/bootstrap-icons";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { UserOverview } from "@tell-it/domain/api-interfaces";
import { StoryData } from "@tell-it/domain/game";
import { MessageComponent } from "../message/message.component";

@Component({
    selector: "tell-it-game-in-progress",
    templateUrl: "./game-in-progress.component.html",
    styleUrls: ["./game-in-progress.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    viewProviders: [provideIcons({ bootstrapStopwatch })],
    imports: [MessageComponent, NgIcon]
})
export class GameInProgressComponent {
    readonly users = input<UserOverview[] | null | undefined>([]);
    readonly user = input<UserOverview | null | undefined>(null);
    readonly story = input<StoryData | null | undefined>(null);
    readonly turnTimer = input<number | null | undefined>(null);
    readonly finishVotes = input<string[] | null | undefined>(null);

    submitText = output<string>();
    voteFinish = output<void>();
}
