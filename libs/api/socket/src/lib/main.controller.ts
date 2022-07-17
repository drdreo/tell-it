import { Controller, HttpStatus, Get, Param, HttpException } from '@nestjs/common';
import { HomeInfo, RoomResponse } from '@socket-template-app/api-interfaces';
import { RoomService } from './room.service';

@Controller()
export class MainController {
    constructor(private readonly roomService: RoomService) {}

    @Get('/home')
    getHomeInfo(): HomeInfo {
        return { rooms: this.roomService.getAllRooms(), userCount: this.roomService.getUserCount() };
    }


    @Get('/room/:name')
    getTable(@Param('name') name): RoomResponse {
        const room = this.roomService.getRoom(name);
        if (room) {
            return {
                name: room.name,
                startTime: room.startTime,
                users: room.getUsersPreview(),
                config: room.getConfig()
            };
        }

        throw new HttpException('Room does not exist!', HttpStatus.NOT_FOUND);
    }
}
