import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WsException, OnGatewayDisconnect, WsResponse, WebSocketServer, ConnectedSocket, OnGatewayConnection, MessageBody } from '@nestjs/websockets';
import { ServerEvent, UserEvent, ServerJoined, HomeInfo, UserVoteKickMessage, UserJoinMessage, ServerSpectatorJoined, UserSpectatorJoinMessage, UserKicked, ServerUsersUpdate, UserSubmitTextMessage, ServerStoryUpdate } from '@tell-it/api-interfaces';
import { GameStatus } from '@tell-it/domain/game';
import { Server, Socket } from 'socket.io';
import { environment } from '../../../../../apps/api/src/environments/environment';
import { RoomService } from './room.service';
import { InvalidConfigError, RoomFullError, RoomStartedError } from './room/errors';
import { RoomCommand, RoomCommandName } from './room/RoomCommands';


// @UseInterceptors(SentryInterceptor)
@WebSocketGateway({
    cors: {
        origin: environment.clientUrl,
        methods: ['GET', 'POST'],
        credentials: true
    }
})
export class MainGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    private socketToRoom = new Map<string, string>();
    private userToSocket = new Map<string, string>();
    private logger = new Logger(MainGateway.name);

    constructor(private roomService: RoomService) {
        this.logger.verbose('Created');


        this.roomService.roomCommands$
            .subscribe((cmd: RoomCommand) => this.handleRoomCommands(cmd));
    }

    handleConnection(socket: Socket) {
        this.logger.debug(`A new socket[${ socket.id }] connected!`);
    }

    handleDisconnect(socket: Socket) {
        this.logger.debug(`A socket[${ socket.id }] disconnected!`);

        const roomOfSocket = this.getRoomBySocketId(socket.id);
        this.handleUserDisconnect(socket.data.userID, roomOfSocket);
    }

    @SubscribeMessage(UserEvent.JoinRoom)
    onJoinRoom(@ConnectedSocket() socket: Socket, @MessageBody() {
        userID,
        roomName,
        userName
    }: UserJoinMessage): WsResponse<ServerJoined> {
        this.logger.log(`User[${ userName }] joining!`);
        let sanitizedRoom = roomName.toLowerCase();
        socket.join(sanitizedRoom);
        this.socketToRoom.set(socket.id, sanitizedRoom);
        socket.data.userID = userID; // either overwrite existing one, reset it if its undefined

        let newUserID;

        // existing user needs to reconnect
        if (userID && this.roomService.userExists(userID)) {
            this.logger.log(`User[${ userName }] needs to reconnect!`);
            newUserID = userID;
            const room = this.roomService.userReconnected(userID);
            this.logger.debug(`Users last room[${ room.name }] found!`);

            if (room.name !== sanitizedRoom) {
                this.logger.warn(`User tried to join other room than they were playing on!`);
                // leave the passed room and join old one again
                socket.leave(sanitizedRoom);
                sanitizedRoom = room.name;
                socket.join(sanitizedRoom);
                this.socketToRoom.set(socket.id, sanitizedRoom);
            }
        } else if (userName) {
            // new User wants to create or join
            this.logger.debug(`New User[${ userName }] wants to create or join [${ sanitizedRoom }]!`);
            try {
                const response = this.roomService.createOrJoinRoom(sanitizedRoom, userName);
                newUserID = response.userID;
                this.sendHomeInfo();
            } catch (e) {
                if (e instanceof InvalidConfigError) {
                    throw new WsException('Invalid config provided!');
                }

                const room = this.roomService.getRoom(sanitizedRoom);
                if (e instanceof RoomStartedError || e instanceof RoomFullError) {
                    if (room && room.getConfig().spectatorsAllowed) {
                        this.logger.debug('Couldnt create or join room, join as spectator!');
                        this.onJoinSpectator(socket, { roomName });
                        return {
                            event: ServerEvent.Joined,
                            data: { userID: userID, room: sanitizedRoom }
                        };
                    } else {
                        this.logger.debug('Couldnt create or join room, but spectating is not allowed!');
                        this.disconnectSocket(socket, sanitizedRoom);
                        throw new WsException('Spectating is not allowed!');
                    }
                } else {
                    console.error(e);
                }
            }
        } else {
            // Spectator joining
            throw new Error('Spectator should not be able to join this way!');
        }

        // connect the socket with its userID
        socket.data.userID = newUserID;
        this.socketToRoom.set(socket.id, sanitizedRoom);
        this.userToSocket.set(newUserID, socket.id);

        // inform everyone that someone joined
        this.roomService.getRoom(sanitizedRoom).sendUsersUpdate();
        return {
            event: ServerEvent.Joined,
            data: { userID: newUserID, room: sanitizedRoom }
        };
    }

    @SubscribeMessage(UserEvent.SpectatorJoin)
    onJoinSpectator(@ConnectedSocket() socket: Socket, @MessageBody() { roomName }: UserSpectatorJoinMessage): WsResponse<ServerSpectatorJoined> {
        const sanitizedRoom = roomName.toLowerCase();
        this.logger.log(`Spectator trying to join room[${ sanitizedRoom }]!`);
        const room = this.roomService.getRoom(sanitizedRoom);

        if (room && room.getConfig().spectatorsAllowed) {
            socket.join(sanitizedRoom);
            this.socketToRoom.set(socket.id, sanitizedRoom);

            // tell the spectator all information if game started: users, game status, etc.
            this.onRequestUpdate(socket);

            return { event: ServerEvent.Joined, data: { room: sanitizedRoom } };
        } else {
            throw new WsException('Spectating is not allowed!');
        }
    }

    @SubscribeMessage(UserEvent.RequestUpdate)
    onRequestUpdate(@ConnectedSocket() socket: Socket) {
        const roomOfSocket = this.socketToRoom.get(socket.id);
        const room = this.roomService.getRoom(roomOfSocket);
        if (!room) {
            throw new WsException('Can not request data. Room not found!');
        }

        room.sendUsersUpdate(socket.id);
        const gameStatus = room.gameStatus;
        // tell the spectator all information if game started: players, game status, board, pot
        if (gameStatus === GameStatus.Started) {
            room.sendUserStoryUpdate(socket.data.userID, socket.id);
        }
        room.sendGameStatusUpdate(socket.id);
    }


    @SubscribeMessage(UserEvent.Start)
    onStartGame(@ConnectedSocket() socket: Socket) {
        const room = this.socketToRoom.get(socket.id);
        this.roomService.start(room);
        this.sendHomeInfo();
    }

    @SubscribeMessage(UserEvent.Leave)
    onUserLeave(@ConnectedSocket() socket: Socket): void {
        const room = this.socketToRoom.get(socket.id);
        this.handleUserDisconnect(socket.data.userID, room);
    }

    @SubscribeMessage(UserEvent.VoteKick)
    onVoteKick(@ConnectedSocket() socket: Socket, @MessageBody() { kickUserID }: UserVoteKickMessage) {
        const room = this.socketToRoom.get(socket.id);
        this.roomService.voteKick(room, socket.data.userID, kickUserID);
    }

    @SubscribeMessage(UserEvent.SubmitText)
    obTextSubmit(@ConnectedSocket() socket: Socket, @MessageBody() { text }: UserSubmitTextMessage) {
        const room = this.socketToRoom.get(socket.id);
        this.roomService.submitNewText(room, socket.data.userID, text);
        this.sendUserTextIndividually(room);
    }

    private sendTo(recipient: string, event: ServerEvent, data?: any) {
        this.server.to(recipient).emit(event, data);
    }

    private sendToAll(event: ServerEvent, data?: any) {
        this.server.emit(event, data);
    }

    private async getSocketIdByUserId(userId: string) {
        return this.userToSocket.get(userId);
    }

    private async getUserIdBySocketId(socketId: string) {
        const sockets = await this.server.fetchSockets();
        const socket = sockets.find((socket) => socket.id === socketId);

        if (socket) {
            return socket.data.userID;
        }
        return undefined;
    }

    private getRoomBySocketId(socketId: string): string | undefined {
        return this.socketToRoom.get(socketId);
    }

    /**
     * Called when a socket disconnects or a user opens the home page (to tell the server that a user navigated away from the room)
     * @param userID
     * @param room
     */
    private handleUserDisconnect(userID: string | undefined, room: string | undefined) {
        if (!userID) {
            return; // user left without joining a room
        }

        if (userID && this.roomService.userExists(userID)) {
            this.logger.debug(`User[${ userID }] left!`);
            this.roomService.userLeft(room, userID);

            if (room) {
                this.sendTo(room, ServerEvent.UserLeft, { userID });
            } else {
                this.logger.error(`User[${ userID }] disconnected or left, but room[${ room }] no longer exists!`);
            }
        }
    }

    // to prevent sockets from still receiving game messages. Leaves the room and unsets all socket data
    private disconnectSocket(socket: any, room: string) {
        socket.leave(room);
        this.socketToRoom.delete(socket.id);
        this.userToSocket.delete(socket.data.userID);
    }

    private async sendUserTextIndividually(roomName: string) {
        const room = this.roomService.getRoom(roomName);
        for (const user of room.getUsersPreview()) {
            const socketId = await this.getSocketIdByUserId(user.id);
            // only tell currently connected users the update
            // and the ones that already submitted and created a story

            if (socketId && !user.disconnected && room.isUserOwner(user.id)) {
                this.sendTo(socketId, ServerEvent.StoryUpdate, { text: room.getTextForUser(user.id) });
            }
        }
    }

    private async sendUsersUpdateToSpectators(roomName: string, data: ServerUsersUpdate) {
        const room = this.roomService.getRoom(roomName);
        const socketsOfRoom = await this.server.in(roomName).fetchSockets();

        for (const socket of socketsOfRoom) {
            const isSpectator = room.isSpectator(socket.data.userID);
            if (isSpectator) {
                this.sendTo(roomName, ServerEvent.UsersUpdate, data);
            }
        }
    }

    private sendHomeInfo() {
        const response: HomeInfo = {
            rooms: this.roomService.getAllRooms(),
            userCount: this.roomService.getUserCount()
        };
        this.sendToAll(ServerEvent.Info, response);
    }

    private handleRoomCommands({ name, data, recipient, room }: RoomCommand) {
        this.logger.verbose(`Room[${ room }] - ${ name }:`);
        this.logger.debug(data);

        const receiver = recipient ? recipient : room;
        recipient ? this.logger.debug('Recipient was set to: ' + recipient) : '';

        switch (name) {
            case RoomCommandName.Info:
                this.sendHomeInfo();
                break;

            case RoomCommandName.UsersUpdate:
                if (!recipient) {
                    this.sendUsersUpdateToSpectators(room, data.users);
                }

                this.sendTo(receiver, ServerEvent.UsersUpdate, { users: data.users });
                break;

            case RoomCommandName.GameStatusUpdate:
                this.sendTo(receiver, ServerEvent.GameStatus, { status: data.status });
                break;

            case RoomCommandName.Closed :
                this.sendTo(receiver, ServerEvent.RoomClosed);
                break;

            case RoomCommandName.UserKicked :
                this.sendTo(receiver, ServerEvent.UserKick, { kickedUser: data.kickedUser } as UserKicked);
                break;

            case RoomCommandName.UserStoryUpdate:
                this.sendTo(receiver, ServerEvent.StoryUpdate, { text: data.story } as ServerStoryUpdate);
                break;

            default:
                this.logger.warn(`Command[${ name }] was not handled!`);
                break;
        }
    }
}
