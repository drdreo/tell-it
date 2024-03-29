import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: (origin: string, callback: (err: Error | null, origin?: any) => void) => {
            console.log({ origin });
            // undefined if localhost
            if (environment.allowList.indexOf(origin) !== -1 || !origin) {
                callback(null, { origin: true });
            } else {
                callback(new Error("Not allowed by CORS"), { origin: false });
            }
        }
    });

    const port = process.env.PORT || 3333;
    await app.listen(port, () => {
        Logger.log("Listening at http://localhost:" + port, "main.ts");
    });
}

bootstrap().catch(err => console.error(err));
