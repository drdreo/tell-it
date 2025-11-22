import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { bootstrapWifi } from "@ng-icons/bootstrap-icons";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { ConnectionState } from "@tell-it/data-access";

@Component({
    selector: "tell-it-connection-status",
    imports: [NgIcon],
    viewProviders: [provideIcons({ bootstrapWifi })],
    template: `
        @if (isBlocking()) {
            <div class="overlay">
                <div class="status-box">
                    @switch (status()) {
                        @case ("offline") {
                            <h2>No Internet Connection</h2>
                            <p>Please check your network settings.</p>
                            <p class="hint">We'll automatically reconnect when you're back online.</p>
                        }
                        @case ("reconnecting") {
                            <div class="spinner"></div>
                            <h2>Reconnecting...</h2>
                            <p>Attempting to restore connection {{ "(" + attemptNumber() + ")" }}</p>
                        }
                        @case ("disconnected") {
                            <h2>Connection Lost</h2>
                            <p>Unable to reconnect automatically.</p>
                            <button (click)="onReconnect()" class="button">Try Reconnect</button>
                        }
                    }
                </div>
            </div>
        } @else {
            <div class="status-indicator" [class.connected]="status() === 'connected'" title="Connected">
                <ng-icon name="bootstrapWifi" size="20" />
            </div>
        }
    `,
    styleUrl: "./connection-status.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectionStatusComponent {
    status = input.required<"offline" | ConnectionState["status"]>();
    attemptNumber = input<number>(1);
    reconnect = output<void>();

    protected isBlocking() {
        // Only show blocking overlay for offline and final disconnected state
        const currentStatus = this.status();
        return currentStatus === "offline" || currentStatus === "disconnected";
    }

    onReconnect() {
        this.reconnect.emit();
    }
}
