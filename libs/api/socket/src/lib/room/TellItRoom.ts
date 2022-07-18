import { Logger } from "@nestjs/common";
import { RoomConfig } from "@tell-it/api-interfaces";
import { BaseRoom } from "./BaseRoom";
import { RoomCommandName } from "./RoomCommands";
import { Story } from "./Story";

export class TellItRoom extends BaseRoom {

  private stories: Story[] = [];

  constructor(public name: string, CONFIG?: RoomConfig) {
    super(name, CONFIG);
    this.logger = new Logger(`TellItRoom[${ name }]`);
    this.logger.log(`Created!`);
  }

  destroy() {
    super.destroy();
    this.stories = [];
  }

  getStories(): Story[] {
    return this.stories;
  }

  getStoryForUser(userId: string): Story | undefined {
    return this.stories.find(story => story.userId === userId);
  }

  getTextForUser(id: string): string | undefined {
    const story = this.getStoryForUser(id);
    if (!story) {
      console.warn("trying to get text, but no story found");
      return;
    }
    return story.getLatestText();
  }

  sendUserStoryUpdate(userID: string, recipient: string) {
    this.commands$.next({
      name: RoomCommandName.UserStoryUpdate,
      room: this.name,
      recipient,
      data: { story: this.getTextForUser(userID) }
    });
  }

  sendGameStatusUpdate(recipient?: string) {
    this.commands$.next({
      name: RoomCommandName.GameStatusUpdate,
      room: this.name,
      recipient,
      data: { status: this.gameStatus }
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
        return;
        // throw new Error("You got to wait for a story to be continued!");
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
}
