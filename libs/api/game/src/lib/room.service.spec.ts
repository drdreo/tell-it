import { Test } from "@nestjs/testing";
import { RoomService } from "./room.service";

describe("RoomService", () => {
  let service: RoomService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RoomService],
    }).compile();

    service = module.get(RoomService);
  });

  it("should be defined", () => {
    expect(service).toBeTruthy();
  });
});
