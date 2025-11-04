import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { StoryData } from "@tell-it/domain/game";
import { MessageComponent } from "../message/message.component";

@Component({
    selector: "tell-it-game-ended",
    templateUrl: "./game-ended.component.html",
    styleUrls: ["./game-ended.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MessageComponent]
})
export class GameEndedComponent {
    readonly finalStories = input<StoryData[] | null>([]);
    readonly restart = output<void>();
    readonly loadFinalStories = output<void>();
}
