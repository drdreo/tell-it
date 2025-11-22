import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { bootstrapHourglassSplit, bootstrapPause, bootstrapPlay } from "@ng-icons/bootstrap-icons";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { TtsService } from "@tell-it/data-access";

const useAISpeech = true;

@Component({
    selector: "tell-it-app-message",
    templateUrl: "./message.component.html",
    styleUrls: ["./message.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgIcon],
    viewProviders: [provideIcons({ bootstrapPlay, bootstrapPause, bootstrapHourglassSplit })]
})
export class MessageComponent {
    private readonly ttsService = inject(TtsService);

    author = input<string | null>(null);
    message = input<string | null>(null);
    ttsEnabled = input(false);

    isReading = this.ttsService.isReading;
    protected readonly isLoadingTts = signal(false);

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
