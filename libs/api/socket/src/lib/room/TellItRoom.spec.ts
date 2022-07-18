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
      room.submitText(userId1, "Second story that is.");
      room.submitText(userId2, "First story that is.");
      room.submitText(userId2, "Second story that is.");
      expect(room.getStories().length).toEqual(2);
    });

    it("should circle stories for users", () => {
      room.submitText(userId1, "First story that is.");
      room.submitText(userId2, "First story that is.");
      room.submitText(userId3, "First story that is.");
      let story = room.getStoryForUser(userId1);

      expect(story.ownerId).toEqual(userId3);
      expect(story.userId).toEqual(userId1);

      room.submitText(userId1, "Second story that is.");
      room.submitText(userId2, "Second story that is.");
      room.submitText(userId3, "Second story that is.");

      room.submitText(userId1, "Third story that is.");
      room.submitText(userId2, "Third story that is.");
      room.submitText(userId3, "Third story that is.");

      story = room.getStoryForUser(userId1);
      expect(story.ownerId).toEqual(userId1);
      expect(story.userId).toEqual(userId1);
    });
  });
});
