export class Story {

	userId: string;  // the current writer of the story
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

	serialize(): string {
		return this.texts.join(". ");
	}
}
