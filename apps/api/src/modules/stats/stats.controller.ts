import { Controller, Get, Query } from "@nestjs/common";
import { StatsService } from "./stats.service";

@Controller("stats")
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get("demo")
  demo(@Query("tenantId") tenantId?: string) {
    return this.stats.demo(tenantId);
  }
}
