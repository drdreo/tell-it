import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiDataAccessModule } from "@tell-it/api/data-access";
import { GameModule } from "@tell-it/api/game";
import { SocketModule } from "@tell-it/api/socket";
import { environment } from "../environments/environment";
import { MainController } from "./main.controller";

const configuration = () => (environment);

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [configuration],
			isGlobal: true
		}),
		TypeOrmModule.forRoot({
			type: "postgres",
			host: environment.database.host,
			port: environment.database.port,
			username: environment.database.user,
			password: environment.database.password,
			database: environment.database.database,
			autoLoadEntities: true,
			ssl: environment.production,
			synchronize: true
		}),
		ApiDataAccessModule,
		SocketModule,
		GameModule
	],
	controllers: [MainController],
	providers: []
})
export class AppModule {}
