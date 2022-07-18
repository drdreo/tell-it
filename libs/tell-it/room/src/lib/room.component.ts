import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'socket-template-app-room',
    templateUrl: './room.component.html',
    styleUrls: ['./room.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomComponent {
    constructor() {}

}
