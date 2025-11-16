import { enableProdMode, importProvidersFrom, provideZonelessChangeDetection } from "@angular/core";
import { environment } from "./environments/environment";
import { AppComponent } from "./app/app.component";
import { provideRouter, Routes } from "@angular/router";
import { withInterceptorsFromDi, provideHttpClient } from "@angular/common/http";
import { BrowserModule, bootstrapApplication } from "@angular/platform-browser";
import { API_URL_TOKEN } from "@tell-it/domain/tokens";

const routes: Routes = [
    {
        path: "",
        loadComponent: () => import("@tell-it/home").then(m => m.HomeComponent)
    },
    {
        path: "room/:roomName",
        loadComponent: () => import("@tell-it/room").then(m => m.RoomComponent)
    }
];

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        provideZonelessChangeDetection(),
        importProvidersFrom(BrowserModule),
        { provide: API_URL_TOKEN, useValue: environment.api.url },
        provideHttpClient(withInterceptorsFromDi()),
        provideRouter(routes)
    ]
}).catch(err => console.error(err));
