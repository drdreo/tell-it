import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { bootstrapHourglassSplit, bootstrapPause, bootstrapPlay } from "@ng-icons/bootstrap-icons";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { TtsService } from "@tell-it/data-access";
import { StoryData } from "@tell-it/domain";

const useAISpeech = true;

@Component({
    selector: "tell-it-app-story",
    templateUrl: "./story.component.html",
    styleUrls: ["./story.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgIcon],
    viewProviders: [provideIcons({ bootstrapPlay, bootstrapPause, bootstrapHourglassSplit })]
})
export class StoryComponent {
    private readonly ttsService = inject(TtsService);

    story = input.required<StoryData>();
    author = computed(() => this.story().author);
    message = computed(() => this.story().text);
    stats = computed(() => this.story().stats);
    ttsEnabled = input(false);

    isLoadingTts = signal(false);
    isReading = this.ttsService.isReading;

    async tts(text: string): Promise<void> {
        // If already reading, stop it (works for both AI and native speech)
        if (this.isReading()) {
            if (useAISpeech) {
                this.ttsService.stopSynthesizedSpeech();
            } else {
                this.ttsService.nativeSpeech(text); // Native speech handles stop internally
            }
            return;
        }

        if (useAISpeech) {
            this.isLoadingTts.set(true);
            try {
                await this.ttsService.synthesizeSpeech(text);
            } finally {
                this.isLoadingTts.set(false);
            }
        } else {
            this.ttsService.nativeSpeech(text);
        }
    }
}
