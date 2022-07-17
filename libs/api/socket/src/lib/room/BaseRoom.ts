import { Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { mergeDeep } from '@socket-template-app/utils';
import { RoomConfig, UserOverview } from '@socket-template-app/api-interfaces';
import { nanoid } from 'nanoid';
import { Subject } from 'rxjs';
import { User } from '../user/User';
import { InvalidConfigError, RoomFullError, RoomStartedError } from './errors';
import { validateConfig } from './room.utils';
import { RoomCommandName, RoomCommand } from './RoomCommands';

const defaultConfig: RoomConfig = {
    spectatorsAllowed: true,
    isPublic: true,
    afk: {
        delay: 30000
    },
    users: {
        min: 2,
        max: 8
    }
};

export class BaseRoom {

    commands$: Subject<RoomCommand>;
    startTime: Date | undefined;
    protected logger;
    private users: User[] = [];
    private roomConfig: RoomConfig;

    constructor(public name: string, CONFIG?: RoomConfig) {
        this.logger = new Logger(`Room[${ name }]`);
        this.logger.log(`Created!`);

        this.setConfig(CONFIG);

        if (this.roomConfig.users.min < 2) {
            throw new Error('Parameter [minUsers] must be a positive integer of a minimum value of 2.');
        }

        if (this.roomConfig.users.min > this.roomConfig.users.max) {
            throw new Error('Parameter [minUsers] must be less than or equal to [maxUsers].');
        }
    }

    getUser(userID: string): User {
        return this.users.find(user => user.id === userID);
    }

    isSpectator(userID: string): boolean {
        return this.users.every(user => user.id !== userID);
    }

    getUsersPreview(): UserOverview[] {
        return {
            ...this.users.map(user => ({...user, kickVotes: [...user.kickVotes]}))
        };
    }

    getConfig(): RoomConfig {
        return { ...this.roomConfig };
    }

    hasStarted(): boolean {
        return !!this.startTime;
    }

    addUser(userName: string): string {
        if (this.hasStarted()) {
            throw new RoomStartedError('Room already started');
        }

        if (this.users.length < this.roomConfig.users.max) {
            // create and add a new user
            const user = new User(nanoid(), userName);
            this.users.push(user);
            return user.id;
        } else {
            throw new RoomFullError('Table is already full!');
        }
    }

    hasUser(userID: string): boolean {
        return this.users.some(user => user.id === userID);
    }

    removeUser(user: User) {
        this.users = this.users.filter(u => u.id !== user.id);
        this.logger.log(`removed User[${ user.name }]`);

        this.sendUsersUpdate();
    }

    getUserIndexByID(userID: string): number {
        return this.users.findIndex(user => user.id === userID);
    }

    getUserCount(): number {
        return this.users.length;
    }

    start() {
        if (this.users.length < this.roomConfig.users.min) {
            throw new WsException('Cant start room. Too little users are in.');
        }
        this.logger.log(`starting...`);

        this.users.map(user => user.reset());

        // this.game = new Game(`Game[${ this.name }]`);

        this.startTime = new Date();
        this.sendRoomStarted();
    }

    destroy(): void {
        this.logger.debug(`Destroy!`);

        this.startTime = undefined;
    }

    sendUsersUpdate(recipient?: string) {
        this.commands$.next({
            name: RoomCommandName.UsersUpdate,
            room: this.name,
            recipient,
            data: { users: this.users }
        });
    }

    isEmpty(): boolean {
        return this.users.every(player => player.disconnected) || this.users.length === 0;
    }

    voteKick(userID: string, kickUserID: string) {
        if (userID === kickUserID) {
            throw new WsException('Stop kicking yourself!');
        }

        const votesNeeded = Math.max(Math.round(this.users.length / 2), 2); // at least 2 votes needed, 50%
        const kickUser = this.getUser(kickUserID);
        if (kickUser.afk) {
            kickUser.kickVotes.add(userID);
            if (kickUser.kickVotes.size >= votesNeeded) {
                this.kickUser(kickUser);
            }
        } else {
            this.logger.warn('Can not kick player who is not AFK!');
        }

    }

    protected sendRoomStarted() {
        this.commands$.next({
            name: RoomCommandName.Started,
            room: this.name
        });
    }

    protected sendGameEnded() {
        this.commands$.next({
            name: RoomCommandName.Ended,
            room: this.name
        });
    }

    protected sendTableClosed() {
        this.commands$.next({
            name: RoomCommandName.Closed,
            room: this.name
        });
    }

    protected sendUserKicked(userName: string) {
        this.commands$.next({
            name: RoomCommandName.UserKicked,
            room: this.name,
            data: { kickedUser: userName }
        });
    }

    protected markUserAFK(userIndex: number) {
        this.users[userIndex].afk = true;
        this.sendUsersUpdate();
    }

    protected unmarkUserAFK(userIndex: number) {
        const user = this.users[userIndex];
        if (user.afk) {
            user.afk = false;
            user.kickVotes.clear();
        }
    }

    private setConfig(customConfig?: RoomConfig): void {

        this.roomConfig = { ...defaultConfig };

        if (customConfig) {
            this.roomConfig = mergeDeep(defaultConfig, customConfig);
            const valid = validateConfig(this.roomConfig);
            if (!valid) {
                this.logger.error('Invalid config provided!');
                throw new InvalidConfigError('Invalid config provided!');
            }
        }

        this.logger.debug(this.roomConfig);
    }

    private kickUser(kickUser: User) {
        this.logger.log(`Kicking user ${ kickUser.name }`);
        this.sendUserKicked(kickUser.name);
        this.removeUser(kickUser);
    }
}
