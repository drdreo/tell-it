export const environment = {
    production: false,
    allowList: [
        "http://localhost:4200",
        "http://10.0.0.42:4200" // local IP
    ],
    database: {
        host: "localhost",
        port: 5432,
        user: "dev-user",
        password: "password1",
        database: "tellit"
    }
};
