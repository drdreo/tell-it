import { StoryData } from '@tell-it/domain/game';

export class Story implements StoryData {

    userId: string;
    private texts: string[] = [];

    constructor(public ownerId: string) {
        this.userId = ownerId;
    }

    addText(text: string) {
        this.texts.push(text);
    }

    getAllTexts(): string[] {
        return this.texts;
    }

    getLatestText(): string {
        return this.texts[this.texts.length - 1];
    }
}
