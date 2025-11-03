import { Controller, Get } from "@nestjs/common";

@Controller("/health")
export class HealthController {
    @Get("/")
    getHomeInfo(): string {
        return "ok";
    }
}
