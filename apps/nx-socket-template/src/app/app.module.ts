import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';
import { API_URL_TOKEN } from '@socket-template-app/domain/tokens';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';

const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('../../../../libs/nx-socket-template/home/src').then(m => m.HomeModule)
    },
    {
        path: 'room/:roomName',
        loadChildren: () => import('../../../../libs/nx-socket-template/room/src').then(m => m.RoomModule)
    }
];

const socketConfig: SocketIoConfig = { url: environment.api.socketUrl, options: {} };

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule,
        HttpClientModule,
        RouterModule.forRoot(routes),
        SocketIoModule.forRoot(socketConfig)],
    providers: [
        {provide: API_URL_TOKEN, useValue: environment.api.url}
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
