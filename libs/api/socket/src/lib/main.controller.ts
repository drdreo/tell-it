import { Controller, HttpStatus, Get, Param, HttpException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HomeInfo, RoomResponse, StoriesResponse } from "@tell-it/api-interfaces";
import { readFile } from "fs/promises";
import { RoomService } from "./room.service";

@Controller()
export class MainController {
	constructor(private configService: ConfigService, private readonly roomService: RoomService) {}

	@Get("/home")
	getHomeInfo(): HomeInfo {
		return { rooms: this.roomService.getAllRooms(), userCount: this.roomService.getUserCount() };
	}


	@Get("/room/:name")
	getTable(@Param("name") name): RoomResponse {
		const room = this.roomService.getRoom(name);
		if (room) {
			return {
				name: room.name,
				startTime: room.startTime,
				users: room.getUsersPreview(),
				config: room.getConfig()
			};
		}

		throw new HttpException("Room does not exist!", HttpStatus.NOT_FOUND);
	}

	@Get("/stories")
	async getStories(): Promise<StoriesResponse> {
		const STORIES_PATH = this.configService.get('STORIES_PATH');
		const existingStories = await readFile(STORIES_PATH);

		return { stories: JSON.parse(existingStories.toString()) };
	}
}
