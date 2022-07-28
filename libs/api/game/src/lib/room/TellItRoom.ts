import { Logger } from "@nestjs/common";
import { RoomConfig } from "@tell-it/domain/api-interfaces";
import { CantWaitError } from "@tell-it/domain/errors";
import { GameStatus, StoryData } from "@tell-it/domain/game";


import { BaseRoom } from "./BaseRoom";
import { RoomCommandName } from "./RoomCommands";
import { Story } from "./Story";

export class TellItRoom extends BaseRoom {

	private stories: Story[] = [];
	private finishVotes = new Set<string>();
	private restartVotes = new Set<string>();

	constructor(public name: string, CONFIG?: RoomConfig) {
		super(name, CONFIG);
		this.logger = new Logger(`TellItRoom[${ name }]`);
		this.logger.log(`Created!`);
	}

	restart() {
		super.restart();
		this.stories = [];
		this.finishVotes.clear();
		this.restartVotes.clear();
		this.sendUsersUpdate();
		this.sendResetUserStories();
	}

	sendResetUserStories(){
		this.commands$.next({
			name: RoomCommandName.UserStoryUpdate,
			room: this.name,
			data: { story: undefined }
		});
	}

	destroy() {
		super.destroy();
	}

	getStories(): StoryData[] {
		return this.stories.map(story => ({ text: story.serialize(), author: this.getNameOfUser(story.ownerId) }));
	}

	getStoryForUser(userId: string): Story | undefined {
		try {
			return this.getUser(userId)?.getCurrentStory();
		} catch (e) {
			return undefined;
		}
	}

	getTextForUser(id: string): StoryData | undefined {
		const story = this.getStoryForUser(id);
		if (!story) {
			this.logger.warn("trying to get text, but no story found");
			return;
		}
		return { text: story.getLatestText(), author: this.getNameOfUser(story.ownerId) };
	}

	getNameOfUser(userID: string): string | undefined {
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

	sendFinalStories() {
		this.commands$.next({
			name: RoomCommandName.FinalStories,
			room: this.name,
			data: { stories: this.getStories() }
		});
	}

	sendPersistStories() {
		this.commands$.next({
			name: RoomCommandName.PersistStories,
			room: this.name,
			data: { stories: this.getStories() }
		});
	}

	submitText(userID: string, text: string) {

		// find new user to continue
		const currentIndex = this.users.findIndex(user => user.id === userID);
		const nextIndex = (currentIndex + 1) % this.users.length;
		const newUser = this.users[nextIndex];

		let story: Story;

		// if this user already owns a story, submit the text to his current story
		if (this.isUserOwner(userID)) {
			try {
				story = this.dequeueUserStory(userID);
			} catch (e) {
				throw new CantWaitError();
			}
		} else {
			story = new Story(userID);
			this.stories.push(story);
		}

		story.addText(text);
		this.enqueueUserStory(newUser.id, story);
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

		if (this.finishVotes.has(userName)) {
			// user already voted, toggle it
			this.finishVotes.delete(userName);
		} else {
			this.finishVotes.add(userName);
		}

		if (this.finishVotes.size >= this.users.length) {
			this.gameEnded();
		}
	}

	getFinishVotes(): string[] {
		return [...this.finishVotes];
	}

	voteRestart(userID: string) {
		const userName = this.users.find(user => user.id === userID)?.name;
		if (!userName) {
			console.error("User name not found");
			return;
		}

		if (this.restartVotes.has(userName)) {
			// user already voted, toggle it
			this.restartVotes.delete(userName);
		} else {
			this.restartVotes.add(userName);
		}

		if (this.restartVotes.size >= this.users.length) {
			this.restart();
		}
	}

	private dequeueUserStory(userID: string): Story {
		return this.getUser(userID)?.dequeueCurrentStory();
	}

	private enqueueUserStory(userID: string, story: Story): void {
		this.getUser(userID)?.enqueueStory(story);
		this.sendUsersUpdate(); // to update the total numbers of queued stories
	}

	private gameEnded() {
		this.gameStatus = GameStatus.Ended;
		this.sendFinalStories();
		this.sendPersistStories();
	}

}
