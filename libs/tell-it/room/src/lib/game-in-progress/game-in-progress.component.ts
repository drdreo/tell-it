import { ChangeDetectionStrategy, Component, input, output, signal, computed } from "@angular/core";
import {
    bootstrapExclamationTriangle,
    bootstrapSend,
    bootstrapCheck,
    bootstrapStopwatch
} from "@ng-icons/bootstrap-icons";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { StoryData, UserOverview } from "@tell-it/domain";
import { TellItUserListComponent } from "@tell-it/ui";
import { StoryComponent } from "../story/story.component";

@Component({
    selector: "tell-it-game-in-progress",
    templateUrl: "./game-in-progress.component.html",
    styleUrls: ["./game-in-progress.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    viewProviders: [provideIcons({ bootstrapStopwatch, bootstrapCheck, bootstrapSend, bootstrapExclamationTriangle })],
    imports: [StoryComponent, NgIcon, TellItUserListComponent]
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
        if (!user) {
            return true;
        }
        const users = this.users() ?? [];

        const someoneHasStories = users.some(({ id, queuedStories }) => id !== user.id && queuedStories > 0);
        if (!story && someoneHasStories) {
            return true;
        }

        return this.inputValue().trim().length === 0;
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
