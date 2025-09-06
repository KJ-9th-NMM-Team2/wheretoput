import { Controller, Get } from "@nestjs/common"
import { timeStamp } from "console"

@Controller('health')
export class HealthController {
    @Get()
    check() {
        return { status: "ok", timeStamp: new Date().toISOString() };
    }
}