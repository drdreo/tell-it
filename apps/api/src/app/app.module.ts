import { Module } from '@nestjs/common';
import { SocketModule } from '@socket-template-app/api/socket';


@Module({
    imports: [SocketModule],
    controllers: [],
    providers: []
})
export class AppModule {}
