import { UserOverview } from '@socket-template-app/api-interfaces';

export class User {
    disconnected = false;
    afk = false;
    kickVotes: Set<string> = new Set();

    constructor(public id: string, public name: string) {
    }

    static getUserOverview(user: User): UserOverview {
        return {
            id: user.id,
            name: user.name,
            disconnected: user.disconnected,
            afk: user.afk,
            kickVotes: [...user.kickVotes]
        };
    }

    reset() {
        this.afk = false;
        this.kickVotes = new Set();
    }
}
