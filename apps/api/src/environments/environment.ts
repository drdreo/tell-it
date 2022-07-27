import { join, resolve } from "path";

const STORIES_FOLDER = join(resolve(__dirname), "stories");
const STORIES_FILE_NAME = "stories.json";
const STORIES_PATH = join(STORIES_FOLDER, STORIES_FILE_NAME);

export const environment = {
	production: false,
	clientUrl: "http://localhost:4200",
	STORIES_PATH
};
