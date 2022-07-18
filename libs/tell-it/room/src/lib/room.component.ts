import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserOverview } from '@tell-it/api-interfaces';
import { SocketService } from '@tell-it/data-access';
import { GameStatus } from '@tell-it/domain/game';
import { Subject, takeUntil, Observable } from 'rxjs';
import { RoomService } from './room.service';

@Component({
    selector: 'tell-it-app-room',
    templateUrl: './room.component.html',
    styleUrls: ['./room.component.scss'],
    providers: [RoomService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomComponent implements OnInit, OnDestroy {

    /***Comes from server*/
    roomName!: string;
    startTime!: number;
    gameStatus$: Observable<GameStatus>;
    users$: Observable<UserOverview[]>;
    user$: Observable<UserOverview | undefined>;
    story$: Observable<string>;
    /***/


    private unsubscribe$ = new Subject<void>();

    constructor(private router: Router, private route: ActivatedRoute, private socketService: SocketService, private roomService: RoomService) {
        this.gameStatus$ = this.roomService.gameStatus$;
        this.users$ = this.roomService.users$;
        this.user$ = this.roomService.user$;
        this.story$ = this.roomService.story$;
    }

    ngOnInit(): void {
        this.route.paramMap
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(async (params) => {
                const room = params.get('roomName');
                this.roomName = room || '';
                try {
                    const { startTime } = await this.roomService.loadRoom(this.roomName);
                    this.startTime = startTime;
                } catch(e){
                    console.error(e);
                    this.router.navigate(['/']);
                }
            });

    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    startGame() {
        this.roomService.startGame();
    }

    submitText(text: string) {
        this.roomService.submitText(text);
    }
}
