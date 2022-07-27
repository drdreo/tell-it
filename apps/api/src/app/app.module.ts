import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SocketModule } from "@tell-it/api/socket";
import { environment } from "../environments/environment";

const configuration = () => (environment);

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [configuration],
			isGlobal: true
		}),
		SocketModule
	],
	controllers: [],
	providers: []
})
export class AppModule {}
