export class Queue<T> {
    private store: T[] = [];

    enqueue(data: T): void {
        this.store.push(data);
    }

    dequeue(): T | undefined {
        if (this.isEmpty()) throw new EmptyQueueException();

        return this.store.shift();
    }

    peek(): T {
        if (this.isEmpty()) throw new EmptyQueueException();

        return this.store[0];
    }

    isEmpty(): boolean {
        return this.size() === 0;
    }

    clear(): void {
        this.store = [];
    }

    size() {
        return this.store.length;
    }
}

export class EmptyQueueException extends Error {
    constructor() {
        super("Queue is empty");
    }
}
