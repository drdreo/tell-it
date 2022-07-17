import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Route } from "@angular/router";
import { RoomComponent } from "./room.component";

export const roomRoutes: Route[] = [{}];

@NgModule({
  imports: [CommonModule, RouterModule],
  declarations: [RoomComponent],
})
export class RoomModule {}
