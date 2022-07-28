import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiDataService } from "./api-data.service";
import { DataController } from "./data.controller";
import { StoryEntity } from "./entities/story.entity";

@Module({
	controllers: [DataController],
	providers: [ApiDataService],
	imports: [
		TypeOrmModule.forFeature([StoryEntity])
	],
	exports: [ApiDataService]
})
export class ApiDataAccessModule {}
