import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
  selector: "tell-it-app-message",
  templateUrl: "./message.component.html",
  styleUrls: ["./message.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageComponent {

  @Input() message!: string | null;

  constructor() {}
}
