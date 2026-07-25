import { Controller, Get, Param, Query } from "@nestjs/common";
import { JourneysService } from "./journeys.service";

@Controller("journeys")
export class JourneysController {
  constructor(private readonly journeys: JourneysService) {}

  @Get()
  list(@Query("tenantId") tenantId?: string) {
    return this.journeys.list(tenantId);
  }

  @Get(":journeyId")
  get(
    @Param("journeyId") journeyId: string,
    @Query("tenantId") tenantId?: string,
  ) {
    return this.journeys.get(journeyId, tenantId);
  }
}
