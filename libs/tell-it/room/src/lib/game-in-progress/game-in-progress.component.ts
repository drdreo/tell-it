import { ChangeDetectionStrategy, Component, input, output, signal, computed } from "@angular/core";
import { bootstrapExclamationTriangle, bootstrapStopwatch } from "@ng-icons/bootstrap-icons";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { StoryData, UserOverview } from "@tell-it/domain";
import { MessageComponent } from "../message/message.component";

@Component({
    selector: "tell-it-game-in-progress",
    templateUrl: "./game-in-progress.component.html",
    styleUrls: ["./game-in-progress.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    viewProviders: [provideIcons({ bootstrapStopwatch, bootstrapExclamationTriangle })],
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

    protected readonly inputValue = signal<string>("");

    protected readonly submitDisabled = computed<boolean>(() => {
        const story = this.story();
        const user = this.user();
        if (story && user) {
            return this.inputValue().trim().length === 0;
        }
        return true;
    });

    protected onInputChange(value: string): void {
        this.inputValue.set(value);
    }

    protected onSubmit(input: HTMLTextAreaElement): void {
        if (this.submitDisabled()) {
            return; // Guard against invalid submissions
        }
        const value = input.value.trim();
        if (value) {
            this.submitText.emit(value);
            input.value = "";
            this.inputValue.set("");
        }
    }
}
