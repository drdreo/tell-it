import { Module } from "@nestjs/common";
import { MainController } from "./main.controller";
import { MainGateway } from "./main.gateway";
import { RoomService } from './room.service';

@Module({
  controllers: [MainController],
  providers: [RoomService, MainGateway],
  exports: [RoomService],
})
export class SocketModule {}
