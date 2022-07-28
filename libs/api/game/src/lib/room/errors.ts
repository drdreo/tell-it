export class InvalidConfigError extends Error {

}

export class RoomStartedError extends Error {
    name = 'RoomStarted';
}

export class RoomFullError extends Error {
    name = 'RoomFull';
}
