import { parse as parseConnectionString} from "pg-connection-string";

const connectionOptions = parseConnectionString(process.env.DATABASE_URL);

export const environment = {
	production: true,
	clientUrl: "https://tell-it.pages.dev",
	database: {
		host: connectionOptions.host,
		port: connectionOptions.port,
		user: connectionOptions.user,
		password: connectionOptions.password,
		database: connectionOptions.database,
	}
};
