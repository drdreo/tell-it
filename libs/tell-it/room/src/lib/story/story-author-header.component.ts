import { ChangeDetectionStrategy, Component, input, output, signal } from "@angular/core";
import { bootstrapDownload, bootstrapHourglassSplit, bootstrapPause, bootstrapPlay } from "@ng-icons/bootstrap-icons";
import { NgIcon, provideIcons } from "@ng-icons/core";

@Component({
    selector: "tell-it-story-author-header",
    template: `
        <div class="author">
            <span class="author-name">{{ author() }}</span>
            <button
                class="stats-badge"
                (click)="statsToggle.emit()"
                [attr.aria-label]="statsExpanded() ? 'Hide story stats' : 'Show story stats'"
                [attr.aria-expanded]="statsExpanded()"
                title="Story stats: {{ wordCount() }} words, {{ turnCount() }} turns">
                <span class="badge-text">{{ wordCount() }} words</span>
            </button>
            @if (ttsEnabled() && hasMessage()) {
                <div class="tts-container">
                    <button
                        class="icon-button"
                        (click)="ttsClick.emit()"
                        [attr.aria-label]="
                            isLoadingTts() ? 'Loading...' : isReading() ? 'Stop text-to-speech' : 'Play text-to-speech'
                        "
                        [class.reading]="isReading()"
                        [class.loading]="isLoadingTts()"
                        [disabled]="isLoadingTts()">
                        <ng-icon
                            [name]="
                                isLoadingTts()
                                    ? 'bootstrapHourglassSplit'
                                    : isReading()
                                      ? 'bootstrapPause'
                                      : 'bootstrapPlay'
                            "
                            [attr.aria-label]="
                                isLoadingTts() ? 'Loading' : isReading() ? 'Stop Button' : 'Play Button'
                            " />
                    </button>
                    <button
                        class="icon-button"
                        (click)="downloadClick.emit()"
                        [attr.aria-label]="'Download story audio'"
                        [disabled]="!isDownloadButtonEnabled()"
                        title="Download story audio">
                        <ng-icon name="bootstrapDownload" [attr.aria-label]="'Download Icon'" />
                    </button>
                </div>
            }
        </div>
    `,
    styles: `
        .author {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1.25rem;
            color: #9ae600;
            font-weight: 600;
            margin-bottom: 0.5rem;

            .author-name {
                flex-shrink: 0;
            }

            .stats-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: rgba(154, 230, 0, 0.15);
                border: 1px solid rgba(154, 230, 0, 0.4);
                border-radius: 12px;
                padding: 0.125rem 0.5rem;
                font-size: 0.75rem;
                color: #9ae600;
                cursor: pointer;
                transition: all 0.2s ease;
                font-weight: 500;

                &:hover {
                    background: rgba(154, 230, 0, 0.25);
                    border-color: rgba(154, 230, 0, 0.6);
                    transform: translateY(-1px);
                }

                &:active {
                    transform: translateY(0);
                }

                .badge-text {
                    font-variant-numeric: tabular-nums;
                }
            }

            .tts-container {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .icon-button {
                display: flex;
                justify-content: center;
                align-items: center;
                background: none;
                border: none;
                padding: 0.25rem 0.5rem;
                color: white;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.2s ease;

                &.loading {
                    cursor: wait;
                    opacity: 0.7;

                    ng-icon {
                        animation: rotate 2s linear infinite;
                    }
                }

                &:hover:not(:disabled) {
                    color: #9ae600;
                    transform: translateY(-1px);
                }

                &:active {
                    transform: translateY(0);
                }

                &:disabled {
                    cursor: not-allowed;
                    opacity: 0.3;
                    pointer-events: none;
                }
            }
        }

        @keyframes rotate {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgIcon],
    viewProviders: [provideIcons({ bootstrapPlay, bootstrapPause, bootstrapHourglassSplit, bootstrapDownload })]
})
export class StoryAuthorHeaderComponent {
    author = input.required<string>();
    wordCount = input.required<number>();
    turnCount = input.required<number>();
    ttsEnabled = input(false);
    hasMessage = input(false);
    isLoadingTts = input(false);
    isReading = input(false);
    statsExpanded = input(false);
    isDownloadButtonEnabled = input(false);

    statsToggle = output<void>();
    ttsClick = output<void>();
    downloadClick = output<void>();
}
