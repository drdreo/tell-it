import { Logger } from "@nestjs/common";
import { RoomConfig } from "@tell-it/api-interfaces";
import { CantWaitError } from "@tell-it/domain/errors";
import { GameStatus, StoryData } from "@tell-it/domain/game";
import { BaseRoom } from "./BaseRoom";
import { RoomCommandName } from "./RoomCommands";
import { Story } from "./Story";

export class TellItRoom extends BaseRoom {

	private stories: Story[] = [];
	private finishVotes = new Set<string>();

	constructor(public name: string, CONFIG?: RoomConfig) {
		super(name, CONFIG);
		this.logger = new Logger(`TellItRoom[${ name }]`);
		this.logger.log(`Created!`);
	}

	destroy() {
		super.destroy();
		this.stories = [];
	}

	getStories(): StoryData[] {
		return this.stories.map(story => ({text: story.serialize(), author: this.getNameOfUser(story.ownerId)}));
	}

	getStoryForUser(userId: string): Story | undefined {
		return this.stories.find(story => story.userId === userId);
	}

	getTextForUser(id: string): StoryData | undefined {
		const story = this.getStoryForUser(id);
		if (!story) {
			console.warn("trying to get text, but no story found");
			return;
		}
		return { text: story.getLatestText(), author: this.getNameOfUser(story.ownerId) };
	}

	getNameOfUser(userID: string): string | undefined{
		return this.users.find(user => user.id === userID)?.name;
	}

	sendUserStoryUpdate(userID: string, recipient: string) {
		this.commands$.next({
			name: RoomCommandName.UserStoryUpdate,
			room: this.name,
			recipient,
			data: { story: this.getTextForUser(userID) }
		});
	}

	submitText(userID: string, text: string) {

		// find new user to continue
		const currentIndex = this.users.findIndex(user => user.id === userID);
		const nextIndex = (currentIndex + 1) % this.users.length;
		const newUser = this.users[nextIndex];

		if (this.isUserOwner(userID)) {
			// if this user is already an owner, find his story
			const story = this.getStoryForUser(userID);

			if (story) {
				story.addText(text);
				story.userId = newUser.id;
			} else {
				throw new CantWaitError();
			}
		} else {
			const newStory = new Story(userID);
			newStory.addText(text);
			newStory.userId = newUser.id;
			this.stories.push(newStory);
		}
	}

	isUserOwner(userID: string) {
		return this.stories.some(story => story.ownerId === userID);
	}

	voteFinish(userID: string) {
		const userName = this.users.find(user => user.id === userID)?.name;
		if (!userName) {
			console.error("User name not found");
			return;
		}

		this.finishVotes.add(userName);

		if (this.finishVotes.size > this.users.length / 2) {
			this.gameStatus = GameStatus.Ended;
		}
	}

	getFinishVotes(): string[] {
		return [...this.finishVotes];
	}
}
