import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { bootstrapPause, bootstrapPlay } from "@ng-icons/bootstrap-icons";
import { NgIcon, provideIcons } from "@ng-icons/core";

@Component({
    selector: "tell-it-app-message",
    templateUrl: "./message.component.html",
    styleUrls: ["./message.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgIcon],
    viewProviders: [provideIcons({ bootstrapPlay, bootstrapPause })]
})
export class MessageComponent {
    author = input<string | null>(null);
    message = input<string | null>(null);
    ttsEnabled = input(false);

    isReading = signal(false);

    tts(text: string): void {
        if (this.isReading()) {
            window.speechSynthesis.cancel();
            this.isReading.set(false);
            return;
        }

        this.isReading.set(true);
        const synth = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.pitch = 1;
        utterThis.rate = 1;
        synth.speak(utterThis);

        utterThis.onend = () => {
            this.isReading.set(false);
        };
    }
}
