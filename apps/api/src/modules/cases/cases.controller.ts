import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CasesService } from "./cases.service";
import { CreateCaseDto } from "./dto";

@Controller("cases")
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Get()
  list(@Query("tenantId") tenantId?: string) {
    return this.cases.list(tenantId);
  }

  @Get(":trackingNumber")
  get(@Param("trackingNumber") trackingNumber: string) {
    return this.cases.findByTrackingNumber(trackingNumber);
  }

  @Post()
  create(@Body() dto: CreateCaseDto) {
    return this.cases.create(dto);
  }
}
