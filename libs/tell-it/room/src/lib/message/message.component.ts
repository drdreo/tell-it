import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
	selector: "tell-it-app-message",
	templateUrl: "./message.component.html",
	styleUrls: ["./message.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageComponent {

	@Input() author!: string | null;
	@Input() message!: string | null;
	@Input() ttsEnabled = false;

	tts(text: string): void {
		const synth = window.speechSynthesis;
		const utterThis = new SpeechSynthesisUtterance(text);
		utterThis.pitch = 1;
		utterThis.rate = 1;
		synth.speak(utterThis);
	}
}
