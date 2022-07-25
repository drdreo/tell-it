import { CantWaitError } from "@tell-it/domain/errors";
import { TellItRoom } from "./TellItRoom";

describe("TellIt Room", () => {
	let room: TellItRoom;

	beforeEach(async () => {
		room = new TellItRoom("test");
	});

	it("should be defined", () => {
		expect(room).toBeDefined();
	});

	describe("submitting stories", () => {

		let userId1;
		let userId2;
		let userId3;

		beforeEach(() => {
			userId1 = room.addUser("user1");
			userId2 = room.addUser("user2");
			userId3 = room.addUser("user3");
		});

		it("should create a new story", () => {
			expect(room.getStories().length).toEqual(0);
			room.submitText(userId1, "First story that is.");
			expect(room.getStories().length).toEqual(1);
		});

		it("should create multiple stories", () => {
			expect(room.getStories().length).toEqual(0);
			room.submitText(userId1, "First story that is.");
			room.submitText(userId2, "First story that is.");
			room.submitText(userId3, "First story that is.");
			expect(room.getStories().length).toEqual(3);
		});

		it("should create 1 story per user", () => {
			expect(room.getStories().length).toEqual(0);
			room.submitText(userId1, "First story that is.");
			room.submitText(userId2, "First story that is.");
			expect(room.getStories().length).toEqual(2);
		});

		it("should throw if user cant submit new text", () => {

			const t = () => {
				room.submitText(userId1, "First story that is.");
				room.submitText(userId1, "Second story that is.");
			};
			expect(t).toThrow(CantWaitError);
		});

		it("should circle stories for users", () => {
			room.submitText(userId1, "First story that is.");
			room.submitText(userId2, "First story that is.");
			room.submitText(userId3, "First story that is.");
			let story = room.getStoryForUser(userId1);

			expect(story.ownerId).toEqual(userId3);
			expect(room.getUser(userId1).totalStories()).toEqual(1);

			room.submitText(userId1, "Second story that is 1");
			room.submitText(userId2, "Second story that is 2");
			room.submitText(userId3, "Second story that is 3");

			room.submitText(userId1, "Third story that is 1");
			room.submitText(userId2, "Third story that is 2");
			room.submitText(userId3, "Third story that is 3");

			story = room.getStoryForUser(userId1);
			expect(story.ownerId).toEqual(userId1);
			expect(room.getUser(userId1).totalStories()).toEqual(1);
		});

		it("should have no story after submitting", () => {
			room = new TellItRoom("test");
			userId1 = room.addUser("user1");
			userId2 = room.addUser("user2");
			room.submitText(userId1, "First story of 1");
			room.submitText(userId2, "First story of 2");
			room.submitText(userId1, "Second story of 1");

			const story = room.getTextForUser(userId1);
			expect(story).toBeUndefined();
		});

	});

	describe("getTextForUser", () => {

		let userId1;
		let userId2;

		beforeEach(() => {
			userId1 = room.addUser("user1");
			userId2 = room.addUser("user2");
		});

		it("should not switch stories", () => {
			room.submitText(userId1, "First story of 1");
			room.submitText(userId2, "First story of 2");

			let story = room.getTextForUser(userId1);
			expect(story.text).toEqual("First story of 2");
			story = room.getTextForUser(userId2);
			expect(story.text).toEqual("First story of 1");

			room.submitText(userId2, "Second story of 2");

			// after second player submitted already, should remain on the same story
			story = room.getTextForUser(userId1);
			expect(story.text).toEqual("First story of 2");

			// since user 2 has already submitted to the user1 story, there should be nothing left to do
			story = room.getTextForUser(userId2);
			expect(story).toBeUndefined();
		});

		it("should not switch stories", () => {
			const userId3 = room.addUser("user3");

			room.submitText(userId1, "First story of 1");
			room.submitText(userId2, "First story of 2");
			room.submitText(userId3, "First story of 3");

			expect(room.getUser(userId1).totalStories()).toEqual(1);
			room.submitText(userId2, "Second story of 2");
			room.submitText(userId3, "Second story of 3");

			expect(room.getUser(userId1).totalStories()).toEqual(1);
			// after everyone is done, except user1 he should have 2 stories waiting
			room.submitText(userId3, "Third story of 3");
			expect(room.getUser(userId1).totalStories()).toEqual(2);
		});

	});
});
