import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { NgIf } from "@angular/common";

@Component({
    selector: "tell-it-app-message",
    templateUrl: "./message.component.html",
    styleUrls: ["./message.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgIf]
})
export class MessageComponent {

	@Input() author!: string | null;
	@Input() message!: string | null;
	@Input() ttsEnabled = false;

	private isReading = false;

	tts(text: string): void {
		if (!this.isReading) {
			this.isReading = true;
			const synth = window.speechSynthesis;
			const utterThis = new SpeechSynthesisUtterance(text);
			utterThis.pitch = 1;
			utterThis.rate = 1;
			synth.speak(utterThis);

			utterThis.onend = () => {
				this.isReading = false;
			};
		}
	}
}
