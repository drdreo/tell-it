import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

const allowlist = [
    'http://localhost:4200',
    'http://10.0.0.42:4200', // local network
    'https://tell-it.pages.dev',
    'https://tell-it.drdreo.com'
];

async function bootstrap() {
	const app = await NestFactory.create(AppModule);  
  app.enableCors({
                  origin: (origin: string, callback: Function) => {
                      console.log({ origin });
                      if (allowlist.indexOf(origin) !== -1 || !origin) {
                          callback(null, { origin: true });
                      } else {
                          callback(new Error('Not allowed by CORS'),  { origin: false });
                      }
                 },
  });
  
	const port = process.env.PORT || 3333;
	await app.listen(port, () => {
		Logger.log("Listening at http://localhost:" + port, "main.ts");
	});
}

bootstrap().catch(err => console.error(err));
