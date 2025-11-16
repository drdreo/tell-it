import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { WebSocketMessage } from "@tell-it/domain/socket-interfaces";
import { API_URL_TOKEN } from "@tell-it/domain/tokens";
import { BehaviorSubject, filter, map, Observable, ReplaySubject, Subject, tap } from "rxjs";
import { STORAGE_CLIENT_ID, STORAGE_ROOM_ID } from "./constants";

/**
 * WebSocket client for Golang backend using native WebSocket API
 * This replaces Socket.IO for plain WebSocket communication
 *
 * Modern Angular implementation using signals for state management
 */
@Injectable({
    providedIn: "root"
})
export class WebSocketClient {
    private API_URL = inject(API_URL_TOKEN);
    private ws: WebSocket | null = null;

    readonly clientId = signal<string | null>(sessionStorage.getItem("tell-it-clientId"));
    readonly roomId = signal<string | null>(sessionStorage.getItem("tell-it-roomId"));
    private _connectionStatus$ = new BehaviorSubject<number>(WebSocket.CLOSED);
    readonly connectionStatus = toSignal(this._connectionStatus$, { initialValue: WebSocket.CLOSED });
    readonly isConnected = computed(() => this.connectionStatus() === WebSocket.OPEN);
    readonly reconnectAttempts = signal(0);

    // Message streams
    private _messages$ = new ReplaySubject<WebSocketMessage>(1);
    readonly messages$ = this._messages$.asObservable();
    readonly successMessages$ = this.messages$.pipe(filter(msg => msg.success !== false));

    // Reconnection logic
    private maxReconnectAttempts = 5;
    private reconnectTimeout: any = null;
    private messageQueue: Array<{ message: any; timestamp: number }> = [];
    private readonly MESSAGE_QUEUE_TIMEOUT = 30000; // 30 seconds
    private readonly MAX_QUEUED_MESSAGES = 50;

    constructor() {
        // Sync clientId signal with sessionStorage
        effect(() => {
            const clientId = this.clientId();
            if (clientId) {
                sessionStorage.setItem(STORAGE_CLIENT_ID, clientId);
            } else {
                sessionStorage.removeItem(STORAGE_CLIENT_ID);
            }
        });

        // Sync roomId signal with sessionStorage
        effect(() => {
            const roomId = this.roomId();
            if (roomId) {
                sessionStorage.setItem(STORAGE_ROOM_ID, roomId);
            } else {
                sessionStorage.removeItem(STORAGE_ROOM_ID);
            }
        });

        effect(() => {
            const status = this.connectionStatus();
            console.log("WebSocket connection status changed:", status);
        });
    }

    get connected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    connect(): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log("WebSocket already connected");
            return;
        }

        const wsUrl = this.API_URL.replace(/^http/, "ws") + "/ws?game=tellit";
        console.log("Connecting to WebSocket:", wsUrl);

        this.ws = new WebSocket(wsUrl);
        this._connectionStatus$.next(WebSocket.CONNECTING);

        this.ws.onopen = () => {
            console.log("WebSocket connected");
            this.reconnectAttempts.set(0);
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            this._connectionStatus$.next(WebSocket.OPEN);
            this.flushMessageQueue();

            // Add a delay before checking reconnect to prevent subscription race conditions
            setTimeout(() => {
                this.checkReconnect();
            }, 200);
        };

        this.ws.onmessage = event => {
            try {
                const data = JSON.parse(event.data);
                console.log("WebSocket message received:", data);

                // Handle both single messages and arrays of messages
                const messages = Array.isArray(data) ? data : [data];
                messages.forEach(message => {
                    this._messages$.next(message);
                });
            } catch (error) {
                console.error("Failed to parse WebSocket message:", error);
            }
        };

        this.ws.onerror = error => {
            console.error("WebSocket error:", error);
        };

        this.ws.onclose = () => {
            console.log("WebSocket disconnected");
            this._connectionStatus$.next(WebSocket.CLOSED);
            this.attemptReconnect();
        };
    }

    /**
     * Check if we need to reconnect to a previous session
     */
    private checkReconnect(): void {
        const clientId = this.clientId();
        const roomId = this.roomId();

        if (clientId && roomId && this.ws) {
            console.log("Attempting to reconnect to previous session:", { clientId, roomId });
            const message = {
                type: "reconnect",
                data: {
                    roomId,
                    clientId
                }
            };
            this.send(message);
        }
    }

    disconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.reconnectAttempts.set(0);
        this.messageQueue = [];

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this._connectionStatus$.next(WebSocket.CLOSED);
    }

    private attemptReconnect(): void {
        const currentAttempts = this.reconnectAttempts();
        if (currentAttempts >= this.maxReconnectAttempts) {
            console.log("Max reconnection attempts reached");
            return;
        }

        this.reconnectAttempts.update(attempts => attempts + 1);
        const newAttempts = this.reconnectAttempts();
        const backoffDelay = Math.min(1000 * Math.pow(2, newAttempts - 1), 10000);

        console.log(`Reconnection attempt ${newAttempts} in ${backoffDelay}ms`);

        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, backoffDelay);
    }

    send(message: any): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected, queueing message");
            this.queueMessage(message);
            return;
        }

        const json = JSON.stringify(message);
        console.log("Sending WebSocket message:", json);
        this.ws.send(json);
    }

    private queueMessage(message: any): void {
        const now = Date.now();

        // Remove expired messages from queue
        this.messageQueue = this.messageQueue.filter(item => now - item.timestamp < this.MESSAGE_QUEUE_TIMEOUT);

        // Check if queue is full
        if (this.messageQueue.length >= this.MAX_QUEUED_MESSAGES) {
            console.warn("Message queue is full, dropping oldest message");
            this.messageQueue.shift();
        }

        // Add new message to queue
        this.messageQueue.push({ message, timestamp: now });
        console.log(`Message queued (${this.messageQueue.length} in queue)`);
    }

    private flushMessageQueue(): void {
        if (this.messageQueue.length === 0) {
            return;
        }

        const now = Date.now();
        console.log(`Flushing ${this.messageQueue.length} queued messages`);

        // Send all non-expired messages
        const messagesToSend = this.messageQueue.filter(item => now - item.timestamp < this.MESSAGE_QUEUE_TIMEOUT);

        messagesToSend.forEach(item => {
            const json = JSON.stringify(item.message);
            console.log("Sending queued message:", json);
            this.ws?.send(json);
        });

        // Clear the queue
        this.messageQueue = [];
    }

    /**
     * Listen for messages of a specific type
     */
    fromMessageType<T = any>(type: string): Observable<T> {
        return this.messages$.pipe(
            filter((msg: any) => msg.type === type && msg.success !== false),
            tap(console.log),
            map((msg: any) => msg.data as T)
        );
    }
}
