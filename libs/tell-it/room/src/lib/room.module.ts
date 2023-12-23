import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Route } from "@angular/router";
import { RoomComponent } from "./room.component";
import { MessageComponent } from "./message/message.component";

export const roomRoutes: Route[] = [
  {
    path: "",
    component: RoomComponent,
  },
];

@NgModule({
    imports: [CommonModule, RouterModule.forChild(roomRoutes), RoomComponent, MessageComponent],
})
export class RoomModule {}
