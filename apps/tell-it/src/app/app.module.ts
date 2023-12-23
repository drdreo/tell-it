import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { Routes, RouterModule } from "@angular/router";
import { API_URL_TOKEN } from "@tell-it/domain/tokens";
import { SocketIoConfig, SocketIoModule } from "ngx-socket-io";
import { environment } from "../environments/environment";

import { AppComponent } from "./app.component";

const routes: Routes = [
    {
        path: "",
        loadChildren: () => import("@tell-it/home").then(m => m.HomeModule)
    },
    {
        path: "room/:roomName",
        loadChildren: () => import("@tell-it/room").then(m => m.RoomModule)
    }
];

const socketConfig: SocketIoConfig = {
    url: environment.api.socketUrl,
    options: {}
};

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(routes), SocketIoModule.forRoot(socketConfig)],
    providers: [{ provide: API_URL_TOKEN, useValue: environment.api.url }],
    bootstrap: [AppComponent]
})
export class AppModule {}
