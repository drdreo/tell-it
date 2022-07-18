import { Module } from '@nestjs/common';
import { SocketModule } from '@tell-it/api/socket';


@Module({
    imports: [SocketModule],
    controllers: [],
    providers: []
})
export class AppModule {}
