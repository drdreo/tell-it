import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
    selector: "tell-it-story-message",
    template: `
        @if (message()) {
            <div class="message">
                <div class="message-container scrollbar-invert">
                    {{ message() }}
                </div>
            </div>
        }
    `,
    styles: `
        .message-container {
            overflow-y: auto;
            word-wrap: break-word;
        }

        .message {
            max-height: 35vh;

            display: flex;
            position: relative;

            color: black;
            background-color: #fff;
            padding: 0.5rem 0.5rem 0.5rem 1rem;
            font-size: 1.25rem;
            border-radius: 3px;
            box-shadow:
                0 0.125rem 0.5rem rgba(255, 255, 255, 0.3),
                0 0.0625rem 0.125rem rgba(255, 255, 255, 0.2);
        }

        .message::before {
            content: "";
            position: absolute;
            width: 0;
            height: 0;
            top: -8px;
            left: 16px;
            border: 0.75rem solid transparent;
            border-top: none;

            border-bottom-color: #fff;
            filter: drop-shadow(0 -0.0625rem 0.0625rem rgba(255, 255, 255, 0.1));
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoryMessageComponent {
    message = input<string>();
}
