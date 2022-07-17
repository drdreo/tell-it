import { RoomConfig } from '@socket-template-app/api-interfaces';


export function validateConfig(config: RoomConfig): boolean {
    const testingConfig = { ...config };
    if (typeof testingConfig.spectatorsAllowed != 'boolean') {
        return false;
    }
    if (typeof testingConfig.isPublic != 'boolean') {
        return false;
    }
    if (isNaN(testingConfig.afk.delay)) {
        return false;
    }

    if (testingConfig.users) {
        if (isNaN(testingConfig.users.min) || testingConfig.users.min < 2) {
            return false;
        }
        if (isNaN(testingConfig.users.min) || testingConfig.users.min < 2) {
            return false;
        }
        if (isNaN(testingConfig.users.max) || testingConfig.users.max < 2) {
            return false;
        }
        if (testingConfig.users.max < testingConfig.users.min) {
            return false;
        }
    }

    return true;
}
