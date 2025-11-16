import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { StoryData, UserOverview } from "@tell-it/domain/game";
import { MessageComponent } from "../message/message.component";

@Component({
    selector: "tell-it-game-ended",
    templateUrl: "./game-ended.component.html",
    styleUrls: ["./game-ended.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MessageComponent]
})
export class GameEndedComponent {
    readonly users = input<UserOverview[] | null | undefined>([]);
    readonly finalStories = input<StoryData[] | null>([]);
    readonly restartVotes = input<string[] | null | undefined>(null);
    readonly restart = output<void>();
    readonly loadFinalStories = output<void>();
}
