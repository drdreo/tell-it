// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    api: {
        url: "http://localhost:3333",
        socketUrl: "http://localhost:3333"
    }
    // api: {
    // 	url: "http://localhost:3333",
    // 	socketUrl: "http://localhost:3333"
    // },
    api: {
        url: "http://10.0.0.42:3333",
        socketUrl: "http://10.0.0.42:3333"
    }
};
