import { ChangeDetectionStrategy, Component, input } from "@angular/core";

export interface StoryStats {
    words: number;
    turns: number;
    avgReadingTime: number;
}

@Component({
    selector: "tell-it-story-stats-panel",
    template: `
        <div class="stats-panel">
            <div class="stat-item">
                <span class="stat-label">Turns</span>
                <span class="stat-value">{{ stats().turns }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Words</span>
                <span class="stat-value">{{ stats().words }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Avg. Reading Time</span>
                <span class="stat-value">{{ formatReadingTime(stats().avgReadingTime) }}</span>
            </div>
        </div>
    `,
    styles: `
        .stats-panel {
            display: flex;
            gap: 1rem;
            padding: 0.75rem 1rem;
            margin-bottom: 0.5rem;
            background: rgba(154, 230, 0, 0.08);
            border: 1px solid rgba(154, 230, 0, 0.2);
            border-radius: 3px;
            animation: slideDown 0.2s ease-out;

            .stat-item {
                display: flex;
                flex-direction: column;
                gap: 0.125rem;

                .stat-label {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.6);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 500;
                }

                .stat-value {
                    font-size: 1rem;
                    color: #9ae600;
                    font-weight: 600;
                    font-variant-numeric: tabular-nums;
                }
            }
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoryStatsPanelComponent {
    stats = input.required<StoryStats>();

    formatReadingTime(seconds: number): string {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
}
