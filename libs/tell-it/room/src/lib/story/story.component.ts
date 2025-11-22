import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { TtsService } from "@tell-it/data-access";
import { StoryData } from "@tell-it/domain";
import { StoryAuthorHeaderComponent } from "./story-author-header.component";
import { StoryMessageComponent } from "./story-message.component";
import { StoryStatsPanelComponent } from "./story-stats-panel.component";

const useAISpeech = true;

@Component({
    selector: "tell-it-app-story",
    templateUrl: "./story.component.html",
    styleUrls: ["./story.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [StoryAuthorHeaderComponent, StoryStatsPanelComponent, StoryMessageComponent]
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
    statsExpanded = signal(false);
    hasAudioCached = computed(() => {
        const message = this.message();
        if (!message) {
            return false;
        }
        return this.ttsService.isAudioCached(message);
    });

    toggleStatsExpanded(): void {
        this.statsExpanded.update(expanded => !expanded);
    }

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

    downloadAudio(): void {
        const message = this.message();
        if (!message) {
            return;
        }
        const author = this.author();
        const timestamp = new Date().toISOString().replace(/:/g, "-");
        const filename = `tell-it_${author}_${timestamp}.wav`;
        this.ttsService.downloadCachedAudio(message, filename);
    }
}
