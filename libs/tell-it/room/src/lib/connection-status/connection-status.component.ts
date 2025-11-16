import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ConnectionState } from "@tell-it/data-access";

@Component({
    selector: "tell-it-connection-status",
    imports: [],
    template: `
        <div class="overlay" [class.blocking]="isBlocking()">
            <div class="status-box" [class.notification]="!isBlocking()">
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
