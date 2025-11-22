import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { UserOverview } from "@tell-it/domain";

@Component({
    selector: "tell-it-app-queue-indicator",
    imports: [],
    template: `
        @for (gameUser of users(); track gameUser.id) {
            <div
                class="user-avatar"
                [class.is-current]="gameUser.id === user()?.id"
                [class.has-queue]="gameUser.queuedStories > 0"
                [class.disconnected]="gameUser.disconnected"
                [class.afk]="gameUser.afk"
                [style.background]="getUserColor(gameUser.id)"
                [attr.aria-label]="
                    gameUser.name + (gameUser.queuedStories > 0 ? ' - ' + gameUser.queuedStories + ' pending' : '')
                "
                [attr.title]="gameUser.name">
                @if (gameUser.queuedStories > 0) {
                    <span class="queue-badge">{{ gameUser.queuedStories }}</span>
                }
            </div>
        }
    `,
    styleUrl: "./queue-indicator.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TellItQueueIndicatorComponent {
    users = input<UserOverview[] | null>();
    user = input<UserOverview | null>();

    protected getUserColor(userId: string): string {
        // Generate a deterministic color based on user ID
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Generate hue from hash (0-360)
        const hue = Math.abs(hash % 360);

        // Check if this is the current user
        const isCurrentUser = userId === this.user()?.id;

        if (isCurrentUser) {
            // Current user gets a pink/red gradient
            return "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
        }

        // Others get a gradient based on their unique hue
        return `linear-gradient(135deg, hsl(${hue}, 70%, 60%) 0%, hsl(${hue}, 70%, 45%) 100%)`;
    }
}
